import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

interface LogWithDetails {
  id: string;
  timestamp: string;
  success: boolean;
  error_message: string;
  command: {
    label: string;
    ref_id: string;
  } | null;
  device: {
    name: string;
    ref_id: string;
  } | null;
}

export function LogsViewer() {
  const [logs, setLogs] = useState<LogWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setLoading(true);

    const { data: logsData } = await supabase
      .from('logs')
      .select('id, timestamp, success, error_message, command_id, device_id')
      .order('timestamp', { ascending: false })
      .limit(50);

    if (!logsData) {
      setLoading(false);
      return;
    }

    const logsWithDetails: LogWithDetails[] = await Promise.all(
      logsData.map(async (log) => {
        let command = null;
        let device = null;

        if (log.command_id) {
          const { data: cmdData } = await supabase
            .from('commands')
            .select('label, ref_id')
            .eq('id', log.command_id)
            .maybeSingle();
          command = cmdData;
        }

        if (log.device_id) {
          const { data: devData } = await supabase
            .from('devices')
            .select('name, ref_id')
            .eq('id', log.device_id)
            .maybeSingle();
          device = devData;
        }

        return {
          id: log.id,
          timestamp: log.timestamp,
          success: log.success,
          error_message: log.error_message,
          command,
          device,
        };
      })
    );

    setLogs(logsWithDetails);
    setLoading(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(date);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Histórico de Execuções</h2>
        <button
          onClick={loadLogs}
          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm"
        >
          Atualizar
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 mt-4">Carregando histórico...</p>
        </div>
      ) : logs.length === 0 ? (
        <div className="bg-slate-800 rounded-2xl p-12 text-center border border-slate-700">
          <Clock className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">
            Nenhum registro encontrado
          </h3>
          <p className="text-slate-400">
            Execute comandos para ver o histórico aqui
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => (
            <div
              key={log.id}
              className={`bg-slate-800 rounded-xl p-4 border transition-all ${
                log.success
                  ? 'border-green-900/30 hover:border-green-800/50'
                  : 'border-red-900/30 hover:border-red-800/50'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`p-2 rounded-lg ${
                  log.success ? 'bg-green-900/30' : 'bg-red-900/30'
                }`}>
                  {log.success ? (
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-400" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div>
                      {log.device && (
                        <h3 className="font-semibold text-white">
                          {log.device.name}
                        </h3>
                      )}
                      {log.command && (
                        <p className="text-sm text-slate-400">
                          {log.command.label}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-slate-500 whitespace-nowrap">
                      {formatDate(log.timestamp)}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs">
                    {log.device && (
                      <code className="px-2 py-1 bg-slate-900 text-slate-400 rounded">
                        {log.device.ref_id}
                      </code>
                    )}
                    {log.command && (
                      <code className="px-2 py-1 bg-slate-900 text-slate-400 rounded">
                        {log.command.ref_id}
                      </code>
                    )}
                    <span className={`px-2 py-1 rounded font-medium ${
                      log.success
                        ? 'bg-green-900/30 text-green-400'
                        : 'bg-red-900/30 text-red-400'
                    }`}>
                      {log.success ? 'Sucesso' : 'Falha'}
                    </span>
                  </div>

                  {!log.success && log.error_message && (
                    <div className="mt-2 p-2 bg-red-900/20 border border-red-800/30 rounded text-sm text-red-400">
                      {log.error_message}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
