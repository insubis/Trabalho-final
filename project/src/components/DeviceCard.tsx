import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Power, Zap, Activity, AlertCircle } from 'lucide-react';
import type { Database } from '../lib/database.types';

type Device = Database['public']['Tables']['devices']['Row'];
type Command = Database['public']['Tables']['commands']['Row'];

interface DeviceCardProps {
  device: Device;
  onUpdate: () => void;
}

export function DeviceCard({ device, onUpdate }: DeviceCardProps) {
  const { user } = useAuth();
  const [commands, setCommands] = useState<Command[]>([]);
  const [executing, setExecuting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadCommands();
  }, [device.id]);

  const loadCommands = async () => {
    const { data } = await supabase
      .from('commands')
      .select('*')
      .eq('device_id', device.id)
      .order('created_at', { ascending: true });

    if (data) {
      setCommands(data);
    }
  };

  const executeCommand = async (command: Command) => {
    if (!user) return;

    setExecuting(true);
    setError('');

    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/execute-command`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          command_id: command.id,
          ref_id: command.ref_id,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Falha ao executar comando');
      }

      await supabase
        .from('logs')
        .insert({
          user_id: user.id,
          command_id: command.id,
          device_id: device.id,
          success: true,
        });

      const newStatus = command.action === 'HIGH' || command.action === 'ON';
      await supabase
        .from('devices')
        .update({ status: newStatus })
        .eq('id', device.id);

      onUpdate();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);

      if (user) {
        await supabase
          .from('logs')
          .insert({
            user_id: user.id,
            command_id: command.id,
            device_id: device.id,
            success: false,
            error_message: errorMessage,
          });
      }
    } finally {
      setExecuting(false);
    }
  };

  const getDeviceIcon = () => {
    switch (device.type) {
      case 'output':
        return <Zap className="w-6 h-6" />;
      case 'sensor':
        return <Activity className="w-6 h-6" />;
      default:
        return <Power className="w-6 h-6" />;
    }
  };

  return (
    <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 hover:border-slate-600 transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-xl ${device.status ? 'bg-green-600' : 'bg-slate-700'}`}>
            {getDeviceIcon()}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">{device.name}</h3>
            <p className="text-sm text-slate-400">Pin {device.pin} • {device.type}</p>
          </div>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
          device.status
            ? 'bg-green-600/20 text-green-400'
            : 'bg-slate-700 text-slate-400'
        }`}>
          {device.status ? 'Ativo' : 'Inativo'}
        </div>
      </div>

      {device.description && (
        <p className="text-sm text-slate-400 mb-4">{device.description}</p>
      )}

      <div className="flex items-center gap-2 mb-4 text-xs text-slate-500">
        <code className="px-2 py-1 bg-slate-900 rounded">{device.ref_id}</code>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-900/20 border border-red-800 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {commands.length > 0 ? (
        <div className="space-y-2">
          {commands.map((command) => (
            <button
              key={command.id}
              onClick={() => executeCommand(command)}
              disabled={executing}
              className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center justify-between group"
            >
              <span>{command.label}</span>
              <code className="text-xs opacity-70 group-hover:opacity-100 transition-opacity">
                {command.ref_id}
              </code>
            </button>
          ))}
        </div>
      ) : (
        <div className="text-center py-4 text-slate-500 text-sm">
          Nenhum comando configurado
        </div>
      )}
    </div>
  );
}
