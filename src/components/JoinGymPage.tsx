import React, { useEffect, useState } from 'react';
import { Building2, CheckCircle2, Dumbbell, GitBranch, Loader2, Send } from 'lucide-react';
import { api } from '../api';
import styles from './DashboardHome.module.css';

export default function JoinGymPage() {
  const [orgs, setOrgs] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [selectedOrg, setSelectedOrg] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [joinLoading, setJoinLoading] = useState(false);
  const [branchLoading, setBranchLoading] = useState(false);
  const [joinError, setJoinError] = useState('');
  const [joinResult, setJoinResult] = useState<any>(null);
  const [requests, setRequests] = useState<any[]>([]);

  useEffect(() => {
    api.org.publicOrgs().then(d => setOrgs(d.organizations || [])).catch(() => setOrgs([]));
    api.gymJoin.listRequests().then(d => setRequests(d.requests || [])).catch(() => setRequests([]));
  }, []);

  useEffect(() => {
    setSelectedBranch('');
    setBranches([]);
    if (!selectedOrg) return;
    setBranchLoading(true);
    api.org.publicBranches(selectedOrg)
      .then(d => setBranches(d.branches || []))
      .catch(() => setBranches([]))
      .finally(() => setBranchLoading(false));
  }, [selectedOrg]);

  const handleJoin = async () => {
    if (!selectedOrg || !selectedBranch) {
      setJoinError('Select an organization and branch first.');
      return;
    }
    setJoinLoading(true);
    setJoinError('');
    setJoinResult(null);
    try {
      const result = await api.gymJoin.createRequest({ organizationId: selectedOrg, branchId: selectedBranch });
      setJoinResult(result);
      setRequests(prev => [result, ...prev]);
    } catch (e: any) {
      setJoinError(e?.message || 'Could not create join request.');
    } finally {
      setJoinLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <section className={styles.joinGymPanel}>
        <div className={styles.joinGymHeader}>
          <div className={styles.joinGymIcon}><Dumbbell size={20} /></div>
          <div>
            <h3>Join Gym</h3>
            <p>Select an organization and branch to initiate your membership request.</p>
          </div>
        </div>
        <div className={styles.joinGymControls}>
          <label className={styles.joinField}>
            <span><Building2 size={14} /> Organization</span>
            <select value={selectedOrg} onChange={e => setSelectedOrg(e.target.value)}>
              <option value="">Select organization</option>
              {orgs.map(org => <option key={org.id} value={org.id}>{org.name}</option>)}
            </select>
          </label>
          <label className={styles.joinField}>
            <span><GitBranch size={14} /> Branch</span>
            <select value={selectedBranch} onChange={e => setSelectedBranch(e.target.value)} disabled={!selectedOrg || branchLoading}>
              <option value="">{branchLoading ? 'Loading branches...' : 'Select branch'}</option>
              {branches.map(branch => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
            </select>
          </label>
          <button className={styles.joinBtn} type="button" onClick={handleJoin} disabled={joinLoading || !selectedOrg || !selectedBranch}>
            {joinLoading ? <Loader2 size={16} className={styles.spinning} /> : <Send size={16} />}
            Join
          </button>
        </div>
        {joinError && <div className={styles.joinError}>{joinError}</div>}
        {joinResult && (
          <div className={styles.joinResult}>
            <CheckCircle2 size={18} />
            <div>
              <strong>Request initiated</strong>
              <span>Request ID: {joinResult.request_id || joinResult.requestId} · Status: {joinResult.status}</span>
              <small>{joinResult.emailSent ? 'Confirmation email sent.' : 'Request saved. Email delivery may be pending.'}</small>
            </div>
          </div>
        )}
        {requests.length > 0 && (
          <div className={styles.joinHistory}>
            {requests.slice(0, 3).map(req => (
              <div key={req.id || req.request_id} className={styles.joinHistoryItem}>
                <span>{req.organizationName || req.organization_name || 'Organization'} · {req.branchName || req.branch_name || 'Branch'}</span>
                <strong>{req.request_id || req.requestId}</strong>
                <em>{req.status}</em>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
