'use client';

import { useStudentMode } from '@/contexts/StudentModeContext';
import HomePage from './homePage';
import StudentsPage from '@/app/students/page';

export default function HomeWrapper() {
  const { isStudentMode, isStudent } = useStudentMode();

  if (isStudentMode && isStudent) { 
    return <StudentsPage />;
  }

  return <HomePage />;
}
