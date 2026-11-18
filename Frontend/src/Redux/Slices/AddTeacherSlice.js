import { createSlice } from '@reduxjs/toolkit'

const initialState = {
    isEditing: false,
    designation: '',
    name: '',
    class: '',
    subject: '',
    dob: '',
    doj: '',
    salary: '',
    address: '',
    phone: '',
    email: ''
};

export const updateTeacherSlice = createSlice({
    name: 'UpdateTeacher',
    initialState,
    reducers: {
        updateTeacherData: (state, action) => {
            const { designation = '', name = '', class: className = '', subject = '', dob = '', doj = '', email = '', phone = '', salary = '', address = '' } = action.payload || {};
            return {
                ...state,
                isEditing: true,
                designation,
                name,
                class: className,
                subject,
                dob,
                doj,
                email,
                phone,
                salary,
                address
            };
        },
        clearTeacherData: () => ({ ...initialState })
    }
});

export const { updateTeacherData, clearTeacherData } = updateTeacherSlice.actions;
export default updateTeacherSlice.reducer;