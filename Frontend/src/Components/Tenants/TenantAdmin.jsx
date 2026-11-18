import { useEffect, useMemo, useState } from 'react';
import {
  ActivateTenant,
  GetAllTenants,
  RegisterTenant,
  RetryTenantProvisioning,
  SuspendTenant
} from '../../Server';
import './TenantAdmin.css';

const emptyForm = { name: '', slug: '', databaseName: '' };

const statusClassName = (status) => {
  switch ((status || '').toLowerCase()) {
    case 'active':
      return 'active';
    case 'pending':
      return 'pending';
    case 'provisionfailed':
      return 'provisionfailed';
    case 'suspended':
      return 'suspended';
    default:
      return 'pending';
  }
};

const TenantAdmin = () => {
  const [tenants, setTenants] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');

  const loadTenants = async () => {
    const data = await GetAllTenants();
    setTenants(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    loadTenants();
  }, []);

  const stats = useMemo(() => {
    return {
      total: tenants.length,
      active: tenants.filter((tenant) => tenant.status === 'Active').length,
      pending: tenants.filter((tenant) => tenant.status === 'Pending' || tenant.status === 'ProvisionFailed').length,
      suspended: tenants.filter((tenant) => tenant.status === 'Suspended').length
    };
  }, [tenants]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleRegister = async (event) => {
    event.preventDefault();
    setBusy(true);
    setMessage('');

    const payload = await RegisterTenant(form);
    const responseMessage = payload?.message || 'Tenant registration completed.';
    setMessage(responseMessage);
    setMessageType(payload?.message ? 'success' : 'error');

    if (!payload?.message || payload?.tenant) {
      await loadTenants();
      setForm(emptyForm);
    }

    setBusy(false);
  };

  const handleAction = async (tenantId, action) => {
    setBusy(true);
    setMessage('');

    let result = null;
    if (action === 'activate') {
      result = await ActivateTenant(tenantId);
    } else if (action === 'suspend') {
      result = await SuspendTenant(tenantId);
    } else if (action === 'retry') {
      result = await RetryTenantProvisioning(tenantId);
    }

    setMessage(result?.message || 'Tenant action completed.');
    setMessageType(result?.message ? 'success' : 'error');

    await loadTenants();
    setBusy(false);
  };

  return (
    <div className='tenant-admin'>
      <div className='tenant-header'>
        <h1>School Tenants</h1>
        <p>Register and manage schools using the tenant-aware operational workflow.</p>
      </div>

      <div className='tenant-summary'>
        <div className='tenant-card'>
          <div className='label'>Total</div>
          <div className='value'>{stats.total}</div>
        </div>
        <div className='tenant-card'>
          <div className='label'>Active</div>
          <div className='value'>{stats.active}</div>
        </div>
        <div className='tenant-card'>
          <div className='label'>Pending</div>
          <div className='value'>{stats.pending}</div>
        </div>
        <div className='tenant-card'>
          <div className='label'>Suspended</div>
          <div className='value'>{stats.suspended}</div>
        </div>
      </div>

      <div className='tenant-panel'>
        <form className='tenant-form' onSubmit={handleRegister}>
          <label>
            School name
            <input
              name='name'
              value={form.name}
              onChange={handleInputChange}
              placeholder='Sunrise Academy'
              required
            />
          </label>

          <label>
            Slug
            <input
              name='slug'
              value={form.slug}
              onChange={handleInputChange}
              placeholder='sunrise-academy'
              required
            />
          </label>

          <label>
            Database name
            <input
              name='databaseName'
              value={form.databaseName}
              onChange={handleInputChange}
              placeholder='sunrise_academy'
              required
            />
          </label>

          <button type='submit' disabled={busy}>
            {busy ? 'Processing...' : 'Register school'}
          </button>
        </form>

        {message && (
          <div className={`tenant-message ${messageType === 'error' ? 'error' : ''}`}>
            {message}
          </div>
        )}
      </div>

      <div className='tenant-panel'>
        <table className='tenant-table'>
          <thead>
            <tr>
              <th>School</th>
              <th>Slug</th>
              <th>Database</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {tenants.map((tenant) => (
              <tr key={tenant.id} className='tenant-row'>
                <td>{tenant.name}</td>
                <td>{tenant.slug}</td>
                <td>{tenant.databaseName}</td>
                <td>
                  <span className={`status-pill ${statusClassName(tenant.status)}`}>
                    {tenant.status || 'Pending'}
                  </span>
                </td>
                <td>
                  <div className='tenant-actions'>
                    {tenant.status !== 'Active' && (
                      <button className='primary' onClick={() => handleAction(tenant.id, 'activate')}>
                        Activate
                      </button>
                    )}
                    {tenant.status !== 'Suspended' && (
                      <button className='danger' onClick={() => handleAction(tenant.id, 'suspend')}>
                        Suspend
                      </button>
                    )}
                    {(tenant.status === 'Pending' || tenant.status === 'ProvisionFailed') && (
                      <button className='secondary' onClick={() => handleAction(tenant.id, 'retry')}>
                        Retry
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TenantAdmin;
