'use client';

import { useState, useEffect } from 'react';
import { X, Plus } from 'lucide-react';
import { useUser } from '@/app/context/UserContext';

interface TodoType {
  id: string;
  name: string;
}

interface NewTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function NewTaskModal({ isOpen, onClose, onSuccess }: NewTaskModalProps) {
  const { userName } = useUser();
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [priority, setPriority] = useState('');
  const [typeId, setTypeId] = useState('');
  const [types, setTypes] = useState<TodoType[]>([]);
  const [showNewType, setShowNewType] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');
  const [loading, setLoading] = useState(false);
  const [creatingType, setCreatingType] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchTypes();
    }
  }, [isOpen]);

  const fetchTypes = async () => {
    try {
      const res = await fetch('/api/todo-types', {
        headers: { 'x-bugbee-token': localStorage.getItem('bugbee_token') || '' }
      });
      if (res.ok) {
        const data = await res.json();
        setTypes(data);
      }
    } catch (err) {
      console.error('Failed to fetch types:', err);
    }
  };

  const handleCreateType = async () => {
    if (!newTypeName.trim()) {
      alert('Please enter a type name');
      return;
    }

    if (!userName) {
      alert('Please enter your name in the header before creating a type');
      return;
    }

    setCreatingType(true);
    try {
      const res = await fetch('/api/todo-types', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-bugbee-token': localStorage.getItem('bugbee_token') || ''
        },
        body: JSON.stringify({
          name: newTypeName.trim(),
          actor_name: userName,
        }),
      });

      if (res.ok) {
        const newType = await res.json();
        setTypes([...types, newType]);
        setTypeId(newType.id);
        setNewTypeName('');
        setShowNewType(false);
      } else if (res.status === 409) {
        const data = await res.json();
        if (data.existing) {
          alert(`A type with this name already exists. Using existing type.`);
          setTypeId(data.existing.id);
          setNewTypeName('');
          setShowNewType(false);
        } else {
          alert('A type with this name already exists');
        }
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to create type');
      }
    } catch (err) {
      console.error('Failed to create type:', err);
      alert('Failed to create type');
    } finally {
      setCreatingType(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      alert('Please enter a title');
      return;
    }

    if (!userName) {
      alert('Please enter your name in the header before creating a task');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/todos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-bugbee-token': localStorage.getItem('bugbee_token') || ''
        },
        body: JSON.stringify({
          title: title.trim(),
          notes: notes.trim() || null,
          priority: priority || null,
          type_id: typeId || null,
          actor_name: userName,
        }),
      });

      if (res.ok) {
        setTitle('');
        setNotes('');
        setPriority('');
        setTypeId('');
        onSuccess();
        onClose();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to create task');
      }
    } catch (err) {
      console.error('Failed to create task:', err);
      alert('Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setTitle('');
    setNotes('');
    setPriority('');
    setTypeId('');
    setShowNewType(false);
    setNewTypeName('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg border border-slate-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-xl font-bold">New Task</h2>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="label">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input w-full"
              placeholder="Enter task title"
              required
            />
          </div>

          <div>
            <label className="label">Type</label>
            {!showNewType ? (
              <div className="flex gap-2">
                <select
                  value={typeId}
                  onChange={(e) => setTypeId(e.target.value)}
                  className="input flex-1"
                >
                  <option value="">No Type</option>
                  {types.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setShowNewType(true)}
                  className="btn btn-secondary flex items-center gap-2 whitespace-nowrap"
                >
                  <Plus size={14} />
                  New Type
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTypeName}
                    onChange={(e) => setNewTypeName(e.target.value)}
                    className="input flex-1"
                    placeholder="Enter new type name"
                  />
                  <button
                    type="button"
                    onClick={handleCreateType}
                    disabled={creatingType}
                    className="btn btn-primary whitespace-nowrap"
                  >
                    {creatingType ? 'Creating...' : 'Create'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewType(false);
                      setNewTypeName('');
                    }}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="label">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="input w-full"
            >
              <option value="">No Priority</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div>
            <label className="label">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="input w-full resize-none"
              rows={4}
              placeholder="Add any additional details (optional)"
            />
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-slate-700">
            <button
              type="button"
              onClick={handleClose}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
            >
              {loading ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
