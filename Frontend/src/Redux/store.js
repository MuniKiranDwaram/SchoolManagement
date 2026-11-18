import { configureStore } from "@reduxjs/toolkit";
import updateTeacherReducer from "./Slices/AddTeacherSlice";
import updateStudentReducer from "./Slices/AddStudentSlice";

export const store = configureStore({
    reducer:{
        UpdateTeacher : updateTeacherReducer,
        UpdateStudent : updateStudentReducer
    }
});