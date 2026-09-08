import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { AdminAPI } from '../../services/apiClient';

const STATUS_COLORS = {
  open: 'bg-amber-100 text-amber-800',
  in_progress: 'bg-blue-100 text-blue-800',
  closed: 'bg-green-100 text-green-800',
};

export default function InvestigationsPage() {
  const { accessToken } = useAuth();
  const [investigations, setInvestigations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', entity_type: '', entity_id: '' });
  const [selected, setSelected] = useState(null);

  const fetchInvestigations = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const res = await AdminAPI.investigations(accessToken);
      setInvestigations(res?.investigations || []);
    } catch (_) {}
    setLoading(false);
  }, [accessToken]);

  useEffect(() => { fetchInvestigations(); }, [fetchInvestigations]);

  const createInvestigation = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    try {
      const res = await AdminAPI.createInvestigation(accessToken, form);
      if (res?.investigation) setInvestigations((prev) => [res.investigation, ...prev]);
      setForm({ title: '', description: '', entity_type: '', entity_id: '' });
      setShowForm(false);
    } catch (_) {
      alert('Failed to create investigation.');
    }
  };

  const viewDetail = async (id) => {
    try {
      const res = await AdminAPI.investigation(accessToken, id);
      setSelected(res?.investigation);
    } catch (_) {}
  };

  if (selected) {
    return (
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <button onClick={() => setSelected(null)} className="text-indigo-600 hover:text-indigo-800 text-sm font-medium mb-4">← Back to list</button>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{selected.title}</h2>
              <p className="text-sm text-gray-500 mt-1">Case #{selected.id?.slice(0, 8)}</p>
            </div>
            <span className={`px-3 py-1 text-sm font-semibold rounded-full ${STATUS_COLORS[selected.status] || 'bg-gray-100 text-gray-800'}`}>
              {selected.status?.replace('_', ' ')}
            </span>
          </div>
          <p className="text-gray-700 mb-4">{selected.description}</p>
          {selected.entity_type && (
            <p className="text-sm text-gray-600">Linked entity: <span className="font-mono">{selected.entity_type} · {selected.entity_id}</span></p>
          )}
          <p className="text-sm text-gray-500 mt-4">Created: {selected.created_at ? new Date(selected.created_at).toLocaleString() : '-'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Investigations</h1>
          <p className="mt-2 text-sm text-gray-500">Open cases, track progress, and resolve supply chain incidents.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
          {showForm ? 'Cancel' : '+ New Investigation'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={createInvestigation} className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="Investigation title" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Entity Type</label>
              <input type="text" value={form.entity_type} onChange={(e) => setForm({ ...form, entity_type: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="batch, shipment, product..." />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" rows={3} placeholder="Describe the incident..." />
            </div>
          </div>
          <button type="submit" className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
            Create Investigation
          </button>
        </form>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : investigations.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-4xl mb-2">🔍</p>
          <p className="text-gray-900 font-semibold">No investigations</p>
          <p className="text-gray-500 text-sm mt-1">Click "+ New Investigation" to open a case.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Entity</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {investigations.map((inv) => (
                <tr key={inv.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{inv.title}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 font-mono">{inv.entity_type || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${STATUS_COLORS[inv.status] || 'bg-gray-100 text-gray-800'}`}>
                      {inv.status?.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{inv.created_at ? new Date(inv.created_at).toLocaleDateString() : '-'}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => viewDetail(inv.id)} className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
