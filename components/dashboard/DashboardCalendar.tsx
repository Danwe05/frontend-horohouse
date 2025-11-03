'use client';
import React, { useState, useEffect } from 'react';
import { CheckCircle, Clock, Calendar as CalendarIconLucide } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

interface Task {
  date: string;
  title: string;
  time: string;
  id: string;
}

const STORAGE_KEY = 'dashboard-calendar-tasks';

const DashboardCalendar = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [view, setView] = useState<'day' | 'week' | 'month' | 'year'>('day');
  const [mounted, setMounted] = useState(false);

  // Modal state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskTime, setTaskTime] = useState('');

  // Load tasks from localStorage on mount
  useEffect(() => {
    setMounted(true);
    try {
      const storedTasks = localStorage.getItem(STORAGE_KEY);
      if (storedTasks) {
        setTasks(JSON.parse(storedTasks));
      }
    } catch (error) {
      console.error('Failed to load tasks from localStorage:', error);
    }
  }, []);

  // Save tasks to localStorage whenever they change
  useEffect(() => {
    if (mounted) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
      } catch (error) {
        console.error('Failed to save tasks to localStorage:', error);
      }
    }
  }, [tasks, mounted]);

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      setTaskTitle('');
      setTaskTime('');
      setIsTaskModalOpen(true);
    }
  };

  const handleAddTask = () => {
    if (!taskTitle || !taskTime || !selectedDate) return;

    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth() + 1;
    const day = selectedDate.getDate();
    const dateKey = `${year}-${month}-${day}`;
    const taskId = `${dateKey}-${Date.now()}`;
    
    const newTask: Task = { 
      date: dateKey, 
      title: taskTitle, 
      time: taskTime,
      id: taskId
    };
    
    setTasks([...tasks, newTask]);
    setIsTaskModalOpen(false);
    setTaskTitle('');
    setTaskTime('');
  };

  const handleCompleteTask = (taskId: string) => {
    setTasks(tasks.filter(t => t.id !== taskId));
  };

  const filterTasks = () => {
    const now = new Date();
    if (view === 'day') {
      return tasks.filter(t => {
        const [y, m, d] = t.date.split('-').map(Number);
        return y === now.getFullYear() && m === now.getMonth() + 1 && d === now.getDate();
      });
    } else if (view === 'week') {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      return tasks.filter(t => {
        const [y, m, d] = t.date.split('-').map(Number);
        const taskDate = new Date(y, m - 1, d);
        return taskDate >= startOfWeek && taskDate <= endOfWeek;
      });
    } else if (view === 'month') {
      return tasks.filter(t => {
        const [y, m] = t.date.split('-').map(Number);
        return y === now.getFullYear() && m === now.getMonth() + 1;
      });
    } else {
      return tasks.filter(t => {
        const [y] = t.date.split('-').map(Number);
        return y === now.getFullYear();
      });
    }
  };

  const getTasksForDate = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const dateKey = `${year}-${month}-${day}`;
    return tasks.filter(t => t.date === dateKey);
  };

  const displayedTasks = filterTasks();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <Card className="border-gray-200 shadow-none">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-gray-800">Calendar</CardTitle>
        </CardHeader>
        <CardContent className="lg:py-3 px-3 space-y-6 w-full">
          {/* Calendar */}
          <div className="dx justify-center relatdiv " >
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              className="rounded-xl  bg-white p-4"
              style={{ width: 'auto' }}
              modifiers={{
                hasTasks: (date: Date) => {
                  const tasksForDate = getTasksForDate(date);
                  return tasksForDate.length > 0;
                }
              }}
              modifiersClassNames={{
                hasTasks: 'font-bold relative after:content-[""] after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:bg-blue-500 after:rounded-full'
              }}
            />
          </div>

          {/* View Toggle */}
          <div className="flex justify-between items-center flex-wrap gap-2">
            <h3 className="text-gray-800 font-bold text-lg">Activity</h3>
            <div className="flex space-x-1 bg-blue-50 rounded-lg p-1">
              {['day', 'week', 'month', 'year'].map(v => (
                <Button
                  key={v}
                  variant={view === v ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setView(v as any)}
                  className={`
                    text-xs transition-all duration-200
                    ${view === v 
                      ? 'bg-white text-blue-600 shadow-sm hover:bg-white' 
                      : 'text-blue-500 hover:text-blue-700 hover:bg-blue-100'
                    }
                  `}
                >
                  {v.charAt(0).toUpperCase() + v.slice(1)}
                </Button>
              ))}
            </div>
          </div>

          {/* Tasks Panel */}
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <CalendarIconLucide className="h-5 w-5 text-blue-600" />
                  <CardTitle className="text-base">Tasks</CardTitle>
                </div>
                <Badge variant="secondary" className="bg-white text-blue-600">
                  {displayedTasks.length}
                </Badge>
              </div>
              
              {/* Progress bar */}
              <div className="h-2 bg-white/80 rounded-full mt-4 overflow-hidden">
                <div 
                  className="h-full bg-blue-500 rounded-full transition-all duration-500"
                  style={{ 
                    width: `${displayedTasks.length > 0 ? Math.min(displayedTasks.length * 20, 100) : 0}%` 
                  }}
                ></div>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {displayedTasks.length > 0 ? (
                  displayedTasks.map((t) => (
                    <Card 
                      key={t.id}
                      className="bg-white/80 backdrop-blur-sm border-white/50 hover:shadow-md transition-all duration-200"
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-800 text-sm mb-1">{t.title}</h4>
                            <div className="flex items-center text-xs text-gray-500">
                              <Clock className="h-3 w-3 mr-1" />
                              {t.time}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-blue-500 hover:text-blue-700 h-auto p-1"
                            onClick={() => handleCompleteTask(t.id)}
                          >
                            <CheckCircle className="h-5 w-5" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-6">
                    <CalendarIconLucide className="h-8 w-8 text-blue-300 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">No tasks for {view} view</p>
                    <p className="text-gray-400 text-xs mt-1">Click on a date to add tasks</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>

      {/* Add Task Modal */}
      <Dialog open={isTaskModalOpen} onOpenChange={setIsTaskModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Task</DialogTitle>
            <DialogDescription>
              {selectedDate && (
                <span className="text-blue-600 font-medium">
                  {selectedDate.getDate()} {monthNames[selectedDate.getMonth()]} {selectedDate.getFullYear()}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="task-title">Task Title</Label>
              <Input
                id="task-title"
                placeholder="Enter task description..."
                value={taskTitle}
                onChange={e => setTaskTitle(e.target.value)}
                autoFocus
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="task-time">Task Time</Label>
              <Input
                id="task-time"
                type="time"
                value={taskTime}
                onChange={e => setTaskTime(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsTaskModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddTask}
              disabled={!taskTitle || !taskTime}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Add Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DashboardCalendar;