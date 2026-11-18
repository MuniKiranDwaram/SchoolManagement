import { createSlice } from '@reduxjs/toolkit'

const initialState = {
    isEditing: false,
    rollNo: '',
    name: '',
    description: '',
    fatherName: '',
    motherName: '',
    class: '',
    fatherOccupation: '',
    caste: '',
    dob: '',
    doj: '',
    email: '',
    parentPhoneNumber: '',
    address: '',
    totalFee: ''
};

export const updateStudentSlice = createSlice({
    name: 'UpdateStudent',
    initialState,
    reducers: {
        updateStudentData: (state, action) => {
            const student = action.payload || {};
            return {
                ...state,
                isEditing: true,
                rollNo: student.rollNo ?? '',
                name: student.name ?? '',
                description: student.description ?? '',
                fatherName: student.fatherName ?? '',
                motherName: student.motherName ?? '',
                class: student.class ?? '',
                fatherOccupation: student.fatherOccupation ?? '',
                caste: student.caste ?? '',
                dob: student.dob ?? '',
                doj: student.doj ?? '',
                email: student.email ?? '',
                parentPhoneNumber: student.parentPhoneNumber ?? '',
                address: student.address ?? '',
                totalFee: student.totalFee ?? ''
            };
        },
        clearStudentData: () => ({ ...initialState })
    }
});

export const { updateStudentData, clearStudentData } = updateStudentSlice.actions;
export default updateStudentSlice.reducer;
