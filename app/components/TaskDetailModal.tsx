'use client';

import { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';

type Priority = 'low' | 'medium' | 'high';

interface TodoType {
  id: string;
  name: string;
}

interface Activity {
  id: string;
  action: string;
  actor_name: string;
  created_at: string;
  details: any;
}

interface Todo {
  id: string;
  title: string;
  notes: string | null;
  priority: Priority | null;
  is_completed: boolean;
  completed_at: string | null;
  completed_by_name: string | null;
  created_at: string;
  created_by_name: string;
  updated_at: string;
  updated_by_name: string;
  archived: boolean;
  type_id: string | null;
  type: TodoType | null;
}

interface TaskDetailModalProps {
  isOpen: boolean;
  todoId: string | null;
  onClose: () => void;
  onUpdate: () => void;
}

export default function TaskDetailModal({ isOpen, todoId, onClose, onUpdate }: TaskDetailModalProps) {
  const { userName } = useUser();
  const [todo, setTodo] = useState<Todo | null>(null);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Edit form state
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [priority, setPriority] = useState<Priority | ''>('');
  const [typeId, setTypeId] = useState<string>('');
  const [isCompleted, setIsCompleted] = useState(false);

  // Type management
  const [types, setTypes] = useState<TodoType[]>([]);
  const [showNewTypeInput, setShowNewTypeInput] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');

  useEffect(() => {
    if (isOpen && todoId) {
      fetchTodoDetails();
      fetchActivity();
      fetchTypes();
    }
  }, [isOpen, todoId]);

  useEffect(() => {
    if (todo) {
      setTitle(todo.title);
      setNotes(todo.notes || '');
      setPriority(todo.priority || '');
      setTypeId(todo.type_id || '');
      setIsCompleted(todo.is_completed);
    }
  }, [todo]);

  const fetchTodoDetails = async () => {
    if (!todoId) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('bugbee_token');
      const res = await fetch(`/api/todos/${todoId}`, {
        headers: { 'x-bugbee-token': token || '' }
      });

      if (res.ok) {
        const data = await res.json();
        setTodo(data);
      }
    } catch (error) {
      console.error('Error fetching todo:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchActivity = async () => {
    if (!todoId) return;

    try {
      const token = localStorage.getItem('bugbee_token');
      const res = await fetch(`/api/todos/${todoId}/activity`, {
        headers: { 'x-bugbee-token': token || '' }
      });

      if (res.ok) {
        const data = await res.json();
        setActivity(data);
      }
    } catch (error) {
      console.error('Error fetching activity:', error);
    }
  };

  const fetchTypes = async () => {
    try {
      const token = localStorage.getItem('bugbee_token');
      const res = await fetch('/api/todo-types', {
        headers: { 'x-bugbee-token': token || '' }
      });

      if (res.ok) {
        const data = await res.json();
        setTypes(data);
      }
    } catch (error) {
      console.error('Error fetching types:', error);
    }
  };

  const handleCreateType = async () => {
    if (!newTypeName.trim()) return;

    try {
      const token = localStorage.getItem('bugbee_token');
      const res = await fetch('/api/todo-types', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-bugbee-token': token || ''
        },
        body: JSON.stringify({
          name: newTypeName.trim(),
          actor_name: userName || 'Anonymous'
        })
      });

      if (res.ok) {
        const newType = await res.json();
        setTypes([...types, newType]);
        setTypeId(newType.id);
        setNewTypeName('');
        setShowNewTypeInput(false);
      } else if (res.status === 409) {
        const data = await res.json();
        setTypeId(data.existing.id);
        setNewTypeName('');
        setShowNewTypeInput(false);
      }
    } catch (error) {
      console.error('Error creating type:', error);
    }
  };

  const handleSave = async () => {
    if (!todoId || !userName) return;

    const updates: any = {
      actor_name: userName
    };

    if (title !== todo?.title) updates.title = title;
    if (notes !== (todo?.notes || '')) updates.notes = notes || null;
    if (priority !== (todo?.priority || '')) updates.priority = priority || null;
    if (typeId !== (todo?.type_id || '')) updates.type_id = typeId || null;
    if (isCompleted !== todo?.is_completed) updates.is_completed = isCompleted;

    try {
      const token = localStorage.getItem('bugbee_token');
      const res = await fetch(`/api/todos/${todoId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-bugbee-token': token || ''
        },
        body: JSON.stringify(updates)
      });

      if (res.ok) {
        await fetchTodoDetails();
        await fetchActivity();
        setIsEditing(false);
        onUpdate();
      }
    } catch (error) {
      console.error('Error updating todo:', error);
    }
  };

  const handleDelete = async () => {
    if (!todoId || !userName) return;

    if (!confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('bugbee_token');
      const res = await fetch(`/api/todos/${todoId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-bugbee-token': token || ''
        },
        body: JSON.stringify({
          actor_name: userName
        })
      });

      if (res.ok) {
        onUpdate();
        onClose();
      } else {
        alert('Failed to delete task');
      }
    } catch (error) {
      console.error('Error deleting todo:', error);
      alert('Failed to delete task');
    }
  };

  const formatActivityAction = (act: Activity) => {
    switch (act.action) {
      case 'created':
        return 'created this task';
      case 'completed':
        return 'marked as completed';
      case 'reopened':
        return 'reopened this task';
      case 'updated':
        if (act.details?.field === 'title') {
          return `changed title to "${act.details.new_value}"`;
        } else if (act.details?.field === 'priority') {
          return `changed priority from ${act.details.old_value || 'none'} to ${act.details.new_value || 'none'}`;
        } else if (act.details?.field === 'type_id') {
          return `changed type`;
        } else if (act.details?.field === 'notes') {
          return `updated notes`;
        }
        return 'updated this task';
      case 'archived':
        return 'archived this task';
      case 'unarchived':
        return 'unarchived this task';
      default:
        return act.action;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold">Task Details</h2>
            {todo?.type && (
              <span className="px-2 py-1 bg-slate-700 text-slate-300 text-xs rounded">
                {todo.type.name}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400">Loading...</div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            <div className="p-6 space-y-6">
              {/* View/Edit Toggle */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded text-xs ${
                    todo?.is_completed
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-blue-500/20 text-blue-400'
                  }`}>
                    {todo?.is_completed ? 'Completed' : 'Open'}
                  </span>
                  {todo?.priority && (
                    <span className={`px-2 py-1 rounded text-xs ${
                      todo.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                      todo.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-slate-600 text-slate-300'
                    }`}>
                      {todo.priority}
                    </span>
                  )}
                </div>
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-3 py-1.5 bg-blue-500/10 text-blue-400 rounded hover:bg-blue-500 hover:text-white transition-all text-sm"
                  >
                    Edit
                  </button>
                ) : (
                  <div className="flex justify-between">
                    <button
                      onClick={handleDelete}
                      disabled={!userName}
                      className="px-3 py-1.5 bg-red-500/10 text-red-400 rounded hover:bg-red-500 hover:text-white transition-all text-sm disabled:opacity-50"
                    >
                      Delete
                    </button>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setIsEditing(false)}
                        className="px-3 py-1.5 bg-slate-700 text-slate-300 rounded hover:bg-slate-600 transition-all text-sm"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={!userName}
                        className="px-3 py-1.5 bg-green-500/10 text-green-400 rounded hover:bg-green-500 hover:text-white transition-all text-sm disabled:opacity-50"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Content */}
              {!isEditing ? (
                <>
                  <div>
                    <h3 className="text-2xl font-semibold mb-2">{todo?.title}</h3>
                    {todo?.notes && (
                      <p className="text-slate-300 whitespace-pre-wrap">{todo.notes}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-slate-400">Created:</span>
                      <div className="text-white">
                        {todo?.created_at && new Date(todo.created_at).toLocaleString()}
                      </div>
                      <div className="text-slate-400 text-xs">by {todo?.created_by_name}</div>
                    </div>
                    <div>
                      <span className="text-slate-400">Last Updated:</span>
                      <div className="text-white">
                        {todo?.updated_at && new Date(todo.updated_at).toLocaleString()}
                      </div>
                      <div className="text-slate-400 text-xs">by {todo?.updated_by_name}</div>
                    </div>
                    {todo?.is_completed && (
                      <div>
                        <span className="text-slate-400">Completed:</span>
                        <div className="text-white">
                          {todo?.completed_at && new Date(todo.completed_at).toLocaleString()}
                        </div>
                        <div className="text-slate-400 text-xs">by {todo?.completed_by_name}</div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Title *</label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded focus:outline-none focus:border-blue-500"
                      required
                    />
                  </div>

                  {/* Type */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Type</label>
                    {!showNewTypeInput ? (
                      <div className="flex gap-2">
                        <select
                          value={typeId}
                          onChange={(e) => setTypeId(e.target.value)}
                          className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded focus:outline-none focus:border-blue-500"
                        >
                          <option value="">None</option>
                          {types.map(t => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                          ))}
                        </select>
                        <button
                          onClick={() => setShowNewTypeInput(true)}
                          className="px-3 py-2 bg-slate-700 text-slate-300 rounded hover:bg-slate-600 text-sm"
                        >
                          + New
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newTypeName}
                          onChange={(e) => setNewTypeName(e.target.value)}
                          placeholder="Type name..."
                          className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded focus:outline-none focus:border-blue-500"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleCreateType();
                            }
                          }}
                        />
                        <button
                          onClick={handleCreateType}
                          className="px-3 py-2 bg-green-500/10 text-green-400 rounded hover:bg-green-500 hover:text-white text-sm"
                        >
                          Create
                        </button>
                        <button
                          onClick={() => {
                            setShowNewTypeInput(false);
                            setNewTypeName('');
                          }}
                          className="px-3 py-2 bg-slate-700 text-slate-300 rounded hover:bg-slate-600 text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Priority */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Priority</label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as Priority | '')}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded focus:outline-none focus:border-blue-500"
                    >
                      <option value="">None</option>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Status</label>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isCompleted}
                          onChange={(e) => setIsCompleted(e.target.checked)}
                          className="w-4 h-4"
                        />
                        <span className="text-sm">Mark as completed</span>
                      </label>
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Notes</label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              )}

              {/* Activity History */}
              <div className="border-t border-slate-700 pt-6">
                <h3 className="text-lg font-semibold mb-4">Activity</h3>
                {activity.length === 0 ? (
                  <p className="text-slate-400 text-sm">No activity yet</p>
                ) : (
                  <div className="space-y-3">
                    {activity.map((act) => (
                      <div key={act.id} className="flex gap-3 text-sm">
                        <div className="flex-shrink-0 w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center text-slate-300 font-medium">
                          {act.actor_name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <div>
                            <span className="font-medium text-white">{act.actor_name}</span>
                            {' '}
                            <span className="text-slate-300">{formatActivityAction(act)}</span>
                          </div>
                          <div className="text-slate-400 text-xs mt-0.5">
                            {formatDate(act.created_at)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
