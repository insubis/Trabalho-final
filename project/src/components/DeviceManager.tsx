import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Plus, CreditCard as Edit, Trash2, Save, X } from 'lucide-react';
import type { Database } from '../lib/database.types';

type Device = Database['public']['Tables']['devices']['Row'];
type Command = Database['public']['Tables']['commands']['Row'];

interface DeviceManagerProps {
  onUpdate: () => void;
}

export function DeviceManager({ onUpdate }: DeviceManagerProps) {
  const { user } = useAuth();
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [commands, setCommands] = useState<Command[]>([]);
  const [showDeviceForm, setShowDeviceForm] = useState(false);
  const [showCommandForm, setShowCommandForm] = useState(false);

  const [deviceForm, setDeviceForm] = useState({
    name: '',
    pin: 0,
    type: 'output',
    ref_id: '',
    description: '',
  });

  const [commandForm, setCommandForm] = useState({
    ref_id: '',
    label: '',
    action: 'HIGH',
    value: 0,
  });

  useEffect(() => {
    loadDevices();
  }, []);

  useEffect(() => {
    if (selectedDevice) {
      loadCommands(selectedDevice.id);
    }
  }, [selectedDevice]);

  const loadDevices = async () => {
    const { data } = await supabase
      .from('devices')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) {
      setDevices(data);
    }
  };

  const loadCommands = async (deviceId: string) => {
    const { data } = await supabase
      .from('commands')
      .select('*')
      .eq('device_id', deviceId)
      .order('created_at', { ascending: true });

    if (data) {
      setCommands(data);
    }
  };

  const handleDeviceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const { error } = await supabase.from('devices').insert({
      ...deviceForm,
      user_id: user.id,
    });

    if (!error) {
      setDeviceForm({ name: '', pin: 0, type: 'output', ref_id: '', description: '' });
      setShowDeviceForm(false);
      loadDevices();
      onUpdate();
    }
  };

  const handleCommandSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDevice) return;

    const { error } = await supabase.from('commands').insert({
      ...commandForm,
      device_id: selectedDevice.id,
    });

    if (!error) {
      setCommandForm({ ref_id: '', label: '', action: 'HIGH', value: 0 });
      setShowCommandForm(false);
      loadCommands(selectedDevice.id);
      onUpdate();
    }
  };

  const deleteDevice = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este dispositivo?')) return;

    await supabase.from('devices').delete().eq('id', id);
    loadDevices();
    onUpdate();
    if (selectedDevice?.id === id) {
      setSelectedDevice(null);
    }
  };

  const deleteCommand = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este comando?')) return;

    await supabase.from('commands').delete().eq('id', id);
    if (selectedDevice) {
      loadCommands(selectedDevice.id);
    }
    onUpdate();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Dispositivos</h2>
          <button
            onClick={() => setShowDeviceForm(!showDeviceForm)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            {showDeviceForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showDeviceForm ? 'Cancelar' : 'Novo Dispositivo'}
          </button>
        </div>

        {showDeviceForm && (
          <form onSubmit={handleDeviceSubmit} className="bg-slate-800 rounded-2xl p-6 border border-slate-700 space-y-4">
            <h3 className="text-lg font-semibold text-white mb-4">Novo Dispositivo</h3>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Nome</label>
              <input
                type="text"
                required
                value={deviceForm.name}
                onChange={(e) => setDeviceForm({ ...deviceForm, name: e.target.value })}
                className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                placeholder="LED Sala"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Pin</label>
                <input
                  type="number"
                  required
                  min="0"
                  max="255"
                  value={deviceForm.pin}
                  onChange={(e) => setDeviceForm({ ...deviceForm, pin: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Tipo</label>
                <select
                  value={deviceForm.type}
                  onChange={(e) => setDeviceForm({ ...deviceForm, type: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="output">Output</option>
                  <option value="sensor">Sensor</option>
                  <option value="servo">Servo</option>
                  <option value="pwm">PWM</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Ref ID (único)</label>
              <input
                type="text"
                required
                value={deviceForm.ref_id}
                onChange={(e) => setDeviceForm({ ...deviceForm, ref_id: e.target.value.toUpperCase() })}
                className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 font-mono"
                placeholder="DEV_LED_01"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Descrição</label>
              <textarea
                value={deviceForm.description}
                onChange={(e) => setDeviceForm({ ...deviceForm, description: e.target.value })}
                className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Descrição opcional do dispositivo"
              />
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
            >
              <Save className="w-4 h-4" />
              Salvar Dispositivo
            </button>
          </form>
        )}

        <div className="space-y-3">
          {devices.map((device) => (
            <div
              key={device.id}
              className={`bg-slate-800 rounded-xl p-4 border cursor-pointer transition-all ${
                selectedDevice?.id === device.id
                  ? 'border-blue-600 bg-slate-800'
                  : 'border-slate-700 hover:border-slate-600'
              }`}
              onClick={() => setSelectedDevice(device)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-white">{device.name}</h3>
                  <p className="text-sm text-slate-400">
                    Pin {device.pin} • {device.type} • {device.ref_id}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteDevice(device.id);
                  }}
                  className="p-2 text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Comandos</h2>
          {selectedDevice && (
            <button
              onClick={() => setShowCommandForm(!showCommandForm)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              {showCommandForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {showCommandForm ? 'Cancelar' : 'Novo Comando'}
            </button>
          )}
        </div>

        {!selectedDevice ? (
          <div className="bg-slate-800 rounded-2xl p-12 text-center border border-slate-700">
            <Edit className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">Selecione um dispositivo para gerenciar comandos</p>
          </div>
        ) : (
          <>
            {showCommandForm && (
              <form onSubmit={handleCommandSubmit} className="bg-slate-800 rounded-2xl p-6 border border-slate-700 space-y-4">
                <h3 className="text-lg font-semibold text-white mb-4">Novo Comando</h3>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Label</label>
                  <input
                    type="text"
                    required
                    value={commandForm.label}
                    onChange={(e) => setCommandForm({ ...commandForm, label: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                    placeholder="Ligar LED"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Ref ID (único)</label>
                  <input
                    type="text"
                    required
                    value={commandForm.ref_id}
                    onChange={(e) => setCommandForm({ ...commandForm, ref_id: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 font-mono"
                    placeholder="CMD_ON_01"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Ação</label>
                    <select
                      value={commandForm.action}
                      onChange={(e) => setCommandForm({ ...commandForm, action: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="HIGH">HIGH (Ligar)</option>
                      <option value="LOW">LOW (Desligar)</option>
                      <option value="ANALOG">ANALOG</option>
                      <option value="PWM">PWM</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Valor</label>
                    <input
                      type="number"
                      min="0"
                      max="255"
                      value={commandForm.value}
                      onChange={(e) => setCommandForm({ ...commandForm, value: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                >
                  <Save className="w-4 h-4" />
                  Salvar Comando
                </button>
              </form>
            )}

            <div className="space-y-3">
              {commands.map((command) => (
                <div
                  key={command.id}
                  className="bg-slate-800 rounded-xl p-4 border border-slate-700"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-white">{command.label}</h3>
                      <p className="text-sm text-slate-400">
                        {command.ref_id} • {command.action}
                        {command.value > 0 && ` (${command.value})`}
                      </p>
                    </div>
                    <button
                      onClick={() => deleteCommand(command.id)}
                      className="p-2 text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              {commands.length === 0 && (
                <div className="text-center py-8 text-slate-500">
                  Nenhum comando configurado
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
