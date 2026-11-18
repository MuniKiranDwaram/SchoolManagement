import axios from "axios";

const getRuntimeEnv = () => {
    if (typeof import.meta !== 'undefined' && import.meta.env) {
        return import.meta.env;
    }

    return {};
};

export const getApiBaseUrl = (runtimeEnv = getRuntimeEnv()) => {
    const configuredBaseUrl = (runtimeEnv?.VITE_API_BASE_URL ?? '').trim();
    return configuredBaseUrl || 'http://localhost:5183';
};

const Api = axios.create({
  baseURL: getApiBaseUrl(),
  withCredentials: true
});

export const isAuthenticated = () => localStorage.getItem('schoolAuth') === 'true';

export const getSchoolName = () => localStorage.getItem('schoolName')?.trim() || 'School';

export const setSchoolName = (schoolName) => {
    const trimmedName = schoolName?.trim();

    if (trimmedName) {
        localStorage.setItem('schoolName', trimmedName);
        return;
    }

    localStorage.removeItem('schoolName');
};

export const setAuthenticated = (value) => {
    if (value) {
        localStorage.setItem('schoolAuth', 'true');
        return;
    }

    localStorage.removeItem('schoolAuth');
};

Api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error?.response?.status === 401 || error?.response?.status === 403) {
            setAuthenticated(false);
            window.location.href = '/login';
        }

        return Promise.reject(error);
    }
);

export const VerifyLogin = async (credentials) => {
    try {
        const res = await Api.post("api/authentication/login", credentials);
        if (res?.status >= 200 && res?.status < 300) {
            setAuthenticated(true);
        }
        return res;
    } catch (error) {
        setAuthenticated(false);

        if (error?.response?.data) {
            return { ...error.response, data: error.response.data };
        }

        return {
            status: 503,
            data: {
                message: 'Unable to connect to the server. Please start the backend and try again.'
            }
        };
    }
};

export const Register = async (User) =>{
    try{
        const res = await Api.post("api/authentication/register",User);
        return res;
    }
    catch(error)
    {
        return error;
    }
}

export const GetAllTenants = async () => {
    try {
        const response = await Api.get('api/SchoolTenant');
        return response.data ?? [];
    } catch (error) {
        return [];
    }
};

export const RegisterTenant = async (tenant) => {
    try {
        const response = await Api.post('api/SchoolTenant/register', tenant);
        return response.data ?? { message: 'Tenant registered successfully.' };
    } catch (error) {
        return error?.response?.data ?? { message: 'Unable to register tenant.' };
    }
};

export const ActivateTenant = async (tenantId) => {
    try {
        const response = await Api.patch(`api/SchoolTenant/${tenantId}/activate`);
        return response.data ?? { message: 'Tenant activated successfully.' };
    } catch (error) {
        return error?.response?.data ?? { message: 'Unable to activate tenant.' };
    }
};

export const SuspendTenant = async (tenantId) => {
    try {
        const response = await Api.patch(`api/SchoolTenant/${tenantId}/suspend`);
        return response.data ?? { message: 'Tenant suspended successfully.' };
    } catch (error) {
        return error?.response?.data ?? { message: 'Unable to suspend tenant.' };
    }
};

export const RetryTenantProvisioning = async (tenantId) => {
    try {
        const response = await Api.patch(`api/SchoolTenant/${tenantId}/retry-provision`);
        return response.data ?? { message: 'Provisioning retry started successfully.' };
    } catch (error) {
        return error?.response?.data ?? { message: 'Unable to retry tenant provisioning.' };
    }
};

export const Logout = async () => {
    try {
        await Api.post('api/authentication/logout');
    } catch (error) {
        // ignore backend logout errors and still clear client state
    } finally {
        setAuthenticated(false);
        window.location.href = '/login';
    }
};

export const AddEntries = async (teacher, operationType = 'Add', role = 'Teacher') => {
    try {
        const formdata = new FormData();
        for (let key in teacher) {
            if (teacher[key] !== undefined && teacher[key] !== null) {
                formdata.append(key, teacher[key]);
            }
        }

        const endpoint = `${role.toLowerCase()}/addTeacher?addType=${operationType}`;
        const response = await Api.post(endpoint, formdata, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response;
    } catch (error) {
        return error;
    }
};

export const AddStudentRecord = async (student, operationType = "Add") => {
    try {
        const response = await Api.post(`student/addStudent?addType=${operationType}`, student);
        return response;
    } catch (error) {
        return error;
    }
};

export const SearchStudentDetails = async (studentName) => {
    try {
        const response = await Api.get(`student/searchStudent?studentName=${encodeURIComponent(studentName)}`);
        return response.data;
    } catch (error) {
        return error;
    }
};

export const SearchTeacherDetails = async (teacherName) =>{
    try
    {
        var res = await Api.get(`teacher/searchTeacher?teacher=${encodeURIComponent(teacherName)}`);
        return res.data;
    }
    catch(error)
    {
        return error;
    }
}

export const DeleteEntry = async (entryRole,name,id) =>{
    try
    {
        const res = await Api.delete(`${entryRole}/${name}/${id}`);
        return res.data;
    }
    catch(error)
    {
        return error;
    }
}

export const GetCalendarEntries = async (type = 'Holiday') => {
    try {
        const response = await Api.get(`calendar?type=${encodeURIComponent(type)}`);
        return response.data;
    } catch (error) {
        return [];
    }
};

export const SaveCalendarEntry = async (entry) => {
    try {
        console.log('Calling SAVE calendar API with payload:', entry);
        const response = await Api.post('calendar', entry);
        console.log('SAVE calendar API response:', response);
        return response.data;
    } catch (error) {
        console.error('SAVE calendar API failed:', error);
        return error;
    }
};

export const UpdateCalendarEntry = async (id, entry) => {
    try {
        console.log('Calling UPDATE calendar API:', id, entry);
        const response = await Api.put(`calendar/${id}`, entry);
        console.log('UPDATE calendar API response:', response);
        return response.data;
    } catch (error) {
        console.error('UPDATE calendar API failed:', error);
        return error;
    }
};

export const DeleteCalendarEntry = async (id) => {
    try {
        const response = await Api.delete(`calendar/${id}`);
        return response.data;
    } catch (error) {
        return error;
    }
};

export const SendCalendarNotification = async (payload) => {
    try {
        const response = await Api.post('calendar/send-whatsapp', payload);
        return response.data;
    } catch (error) {
        return error;
    }
};

export const GetFeeDetails = async (studentName) => {
    try {
        const response = await Api.get(`billing/getFeeDetails?studentName=${encodeURIComponent(studentName)}`);
        return response.data;
    } catch (error) {
        return error;
    }
};

export const GetPaymentDetails = async (studentName) => {
    try {
        const response = await Api.get(`billing/paymentDetails?studentName=${encodeURIComponent(studentName)}`);
        return response.data;
    } catch (error) {
        return error;
    }
};

export const GetDashboardSummary = async () => {
    try {
        const response = await Api.get('dashboard/summary');
        return response.data;
    } catch (error) {
        return error;
    }
};

export const PayStudentFee = async (studentName, amount, paymentMode = 'Cash', referenceNumber = '', notes = '') => {
    try {
        const response = await Api.post("billing/payFee", { studentName, amount, paymentMode, referenceNumber, notes, paymentDate: new Date().toISOString() });
        return response.data;
    } catch (error) {
        return error;
    }
};

