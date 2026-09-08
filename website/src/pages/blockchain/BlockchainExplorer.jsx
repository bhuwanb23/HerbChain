import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { BlockchainAPI } from '../../services/apiClient';

export default function BlockchainExplorer() {
  const { accessToken } = useAuth();
  const [activeTab, setActiveTab] = useState('events');
  const [events, setEvents] = useState([]);
  const [nodes, setNodes] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [batchFilter, setBatchFilter] = useState('');

  useEffect(() => {
    if (!accessToken) return;
    setLoading(true);
    Promise.all([
      BlockchainAPI.events(accessToken, { limit: 100 }),
      BlockchainAPI.nodes(accessToken),
      BlockchainAPI.contracts(accessToken),
      BlockchainAPI.dashboard(accessToken),
    ])
      .then(([eventsRes, nodesRes, contractsRes, dashRes]) => {
        setEvents(eventsRes?.events || []);
        setNodes(nodesRes?.nodes || []);
        setContracts(contractsRes?.contracts || []);
        setDashboard(dashRes);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [accessToken]);

  const filteredEvents = batchFilter
    ? events.filter((e) => e.batch_id?.includes(batchFilter) || e.entity_id?.includes(batchFilter))
    : events;

  const processQueue = async () => {
    try {
      await BlockchainAPI.process(accessToken);
      alert('Blockchain queue processed.');
    } catch (_) {
      alert('Failed to process queue.');
    }
  };

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Blockchain Audit Center</h1>
          <p className="mt-2 text-sm text-gray-500">Immutable event ledger, node health, and smart contract status.</p>
        </div>
        <button onClick={processQueue} className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
          Process Queue
        </button>
      </div>

      {/* Dashboard stats */}
      {dashboard && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard label="Total Events" value={dashboard.total_events || 0} />
          <StatCard label="Pending" value={dashboard.pending || 0} color="text-amber-600" />
          <StatCard label="Confirmed" value={dashboard.confirmed || 0} color="text-green-600" />
          <StatCard label="Failed" value={dashboard.failed || 0} color="text-red-600" />
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1 w-fit">
        {['events', 'nodes', 'contracts'].map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-md text-sm font-medium capitalize ${activeTab === tab ? 'bg-white shadow text-gray-900' : 'text-gray-600 hover:text-gray-900'}`}>
            {tab}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : activeTab === 'events' ? (
        <div>
          <input type="text" placeholder="Filter by batch ID..." value={batchFilter} onChange={(e) => setBatchFilter(e.target.value)}
            className="mb-4 w-72 rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Entity</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Batch</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredEvents.map((e) => (
                  <tr key={e.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{e.event_type || e.type || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{e.entity_type} · {e.entity_id?.slice(0, 8)}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 font-mono">{e.batch_id?.slice(0, 12) || '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${e.status === 'confirmed' ? 'bg-green-100 text-green-800' : e.status === 'pending' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'}`}>
                        {e.status || 'pending'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{e.created_at ? new Date(e.created_at).toLocaleDateString() : '-'}</td>
                  </tr>
                ))}
                {filteredEvents.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">No blockchain events found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeTab === 'nodes' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {nodes.map((n) => (
            <div key={n.id} className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className={`w-2 h-2 rounded-full ${n.status === 'active' ? 'bg-green-500' : 'bg-gray-400'}`} />
                <span className="font-semibold text-gray-900">{n.name || n.node_id || 'Node'}</span>
              </div>
              <p className="text-sm text-gray-600">Region: {n.region || '-'}</p>
              <p className="text-sm text-gray-600">Last heartbeat: {n.last_heartbeat ? new Date(n.last_heartbeat).toLocaleString() : '-'}</p>
            </div>
          ))}
          {nodes.length === 0 && <p className="text-gray-500 col-span-3 text-center py-8">No nodes registered.</p>}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {contracts.map((c) => (
            <div key={c.id || c.name} className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900">{c.name || c.contract_name}</h3>
              <p className="text-sm text-gray-600 mt-1">Address: <span className="font-mono">{c.address || '-'}</span></p>
              <p className="text-sm text-gray-600">Version: {c.version || '-'}</p>
              <span className={`inline-flex mt-2 px-2 py-1 text-xs font-semibold rounded-full ${c.status === 'deployed' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                {c.status || 'unknown'}
              </span>
            </div>
          ))}
          {contracts.length === 0 && <p className="text-gray-500 col-span-2 text-center py-8">No contracts deployed.</p>}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color = 'text-gray-900' }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
    </div>
  );
}
