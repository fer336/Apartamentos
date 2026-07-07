import React, { useState, useEffect } from 'react';
import { X, Check, Plus, Trash2, Calendar, ListTodo, MoreVertical, Menu } from 'lucide-react';
import { getTasks, createTask, updateTask, deleteTask, getProperties } from '../services/api';

interface TaskManagerProps {
    isOpen: boolean;
    onClose: () => void;
}

export const TaskManager: React.FC<TaskManagerProps> = ({ isOpen, onClose }) => {
    const [tasks, setTasks] = useState<any[]>([]);
    const [properties, setProperties] = useState<any[]>([]);
    const [selectedList, setSelectedList] = useState<string | null>(null); // null = Todas, 'general' = General, UUID = Propiedad
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [showMobileMenu, setShowMobileMenu] = useState(false); // Para versión móvil

    useEffect(() => {
        if (isOpen) {
            loadData();
        }
    }, [isOpen]);

    const loadData = async () => {
        try {
            const [tasksData, propsData] = await Promise.all([
                getTasks(),
                getProperties()
            ]);
            setTasks(tasksData);
            setProperties(propsData);
        } catch (error) {
            console.error('Error loading tasks:', error);
        }
    };

    const handleAddTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTaskTitle.trim()) return;

        try {
            const propertyId = selectedList === 'general' ? null : selectedList;
            await createTask({
                title: newTaskTitle,
                property_id: propertyId
            });
            setNewTaskTitle('');
            setIsAdding(false);
            loadData();
        } catch (error) {
            console.error('Error creating task:', error);
        }
    };

    const handleToggleComplete = async (task: any) => {
        try {
            // Optimistic update
            const updatedTasks = tasks.map(t =>
                t.id === task.id ? { ...t, is_completed: !t.is_completed } : t
            );
            setTasks(updatedTasks);

            await updateTask(task.id, { is_completed: !task.is_completed });
        } catch (error) {
            console.error('Error updating task:', error);
            loadData(); // Revert on error
        }
    };

    const handleDeleteTask = async (id: string) => {
        if (confirm('¿Eliminar esta tarea?')) {
            try {
                await deleteTask(id);
                loadData();
            } catch (error) {
                console.error('Error deleting task:', error);
            }
        }
    };

    const filteredTasks = tasks.filter(task => {
        if (selectedList === null) return true; // Todas
        if (selectedList === 'general') return task.property_id === null;
        return task.property_id === selectedList;
    });

    const getListName = () => {
        if (selectedList === null) return 'Todas las tareas';
        if (selectedList === 'general') return 'General';
        const prop = properties.find(p => p.id === selectedList);
        return prop ? prop.name : 'Lista';
    };

    const handleSelectList = (listId: string | null) => {
        setSelectedList(listId);
        setShowMobileMenu(false); // Cerrar menú en móvil al seleccionar
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[120] backdrop-blur-sm animate-in fade-in">
            <div className="bg-white w-full h-full md:w-[90vw] md:h-[85vh] md:rounded-3xl shadow-2xl flex overflow-hidden text-gray-800 font-sans relative">

                {/* Sidebar (Desktop & Mobile Drawer) */}
                <div className={`
          absolute inset-0 z-20 bg-gray-50 md:static md:w-72 md:flex-none border-r border-gray-200 flex flex-col transition-transform duration-300 ease-in-out
          ${showMobileMenu ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}>
                    <div className="p-6 flex items-center justify-between bg-white md:bg-transparent border-b md:border-none border-gray-100">
                        <div className="flex items-center gap-2 text-blue-600 font-bold text-xl">
                            <div className="bg-blue-100 p-2 rounded-lg">
                                <Check className="w-5 h-5" />
                            </div>
                            Tareas
                        </div>
                        {/* Close Menu Button (Mobile Only) */}
                        <button
                            onClick={() => setShowMobileMenu(false)}
                            className="md:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto px-3 space-y-1 py-2">
                        <button
                            onClick={() => handleSelectList(null)}
                            className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-colors ${selectedList === null ? 'bg-blue-50 text-blue-700 font-medium' : 'hover:bg-gray-200/50 text-gray-600'}`}
                        >
                            <ListTodo className="w-5 h-5" />
                            <span>Todas las tareas</span>
                        </button>

                        <div className="pt-4 pb-2 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider">
                            Listas
                        </div>

                        <button
                            onClick={() => handleSelectList('general')}
                            className={`w-full text-left px-4 py-2.5 rounded-xl flex items-center gap-3 transition-colors ${selectedList === 'general' ? 'bg-white shadow-sm text-gray-900 font-medium' : 'hover:bg-gray-200/50 text-gray-600'}`}
                        >
                            <div className="w-2 h-2 rounded-full bg-gray-400" />
                            <span>General</span>
                        </button>

                        {properties.map(prop => (
                            <button
                                key={prop.id}
                                onClick={() => handleSelectList(prop.id)}
                                className={`w-full text-left px-4 py-2.5 rounded-xl flex items-center gap-3 transition-colors ${selectedList === prop.id ? 'bg-white shadow-sm text-gray-900 font-medium' : 'hover:bg-gray-200/50 text-gray-600'}`}
                            >
                                <div className="w-2 h-2 rounded-full bg-purple-400" />
                                <span className="truncate flex-1">{prop.name}</span>
                                {tasks.filter(t => t.property_id === prop.id && !t.is_completed).length > 0 && (
                                    <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full text-gray-500 font-medium">
                                        {tasks.filter(t => t.property_id === prop.id && !t.is_completed).length}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>

                    <div className="p-4 border-t border-gray-200 bg-gray-50 md:bg-transparent">
                        <button onClick={onClose} className="w-full py-2 text-gray-500 hover:text-gray-800 transition-colors text-sm font-medium">
                            Cerrar Gestor
                        </button>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex flex-col bg-white w-full">
                    {/* Header */}
                    <div className="p-4 md:p-8 pb-4 flex items-center justify-between border-b md:border-none border-gray-100">
                        <div className="flex items-center gap-3">
                            {/* Mobile Menu Toggle */}
                            <button
                                onClick={() => setShowMobileMenu(true)}
                                className="md:hidden p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                            >
                                <Menu className="w-6 h-6" />
                            </button>

                            <div>
                                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1 truncate max-w-[200px] md:max-w-md">{getListName()}</h2>
                                <p className="text-gray-500 text-sm">
                                    {filteredTasks.filter(t => !t.is_completed).length} pendientes
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={onClose}
                                className="md:hidden p-2 text-gray-400 hover:bg-gray-100 rounded-full"
                            >
                                <X className="w-6 h-6" />
                            </button>
                            <button className="hidden md:block p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors">
                                <MoreVertical className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Add Task Input */}
                    <div className="px-4 md:px-8 mb-6 mt-4">
                        {!isAdding ? (
                            <button
                                onClick={() => setIsAdding(true)}
                                className="flex items-center gap-3 text-gray-500 hover:text-blue-600 transition-colors group w-full p-2 rounded-xl hover:bg-blue-50"
                            >
                                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                                    <Plus className="w-5 h-5" />
                                </div>
                                <span className="text-lg font-medium">Agregar una tarea</span>
                            </button>
                        ) : (
                            <form onSubmit={handleAddTask} className="bg-white border-2 border-blue-100 shadow-lg rounded-xl p-4 animate-in fade-in slide-in-from-top-2">
                                <input
                                    autoFocus
                                    type="text"
                                    placeholder={`Agregar tarea en ${getListName()}...`}
                                    value={newTaskTitle}
                                    onChange={(e) => setNewTaskTitle(e.target.value)}
                                    className="w-full bg-transparent border-none outline-none text-gray-900 text-lg placeholder-gray-400 mb-3"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Escape') {
                                            setIsAdding(false);
                                            setNewTaskTitle('');
                                        }
                                    }}
                                />
                                <div className="flex justify-between items-center">
                                    <div className="flex gap-2">
                                        <button type="button" className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-blue-500">
                                            <Calendar className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setIsAdding(false)}
                                            className="px-4 py-1.5 text-gray-500 hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={!newTaskTitle.trim()}
                                            className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                                        >
                                            Guardar
                                        </button>
                                    </div>
                                </div>
                            </form>
                        )}
                    </div>

                    {/* Task List */}
                    <div className="flex-1 overflow-y-auto px-4 md:px-8 pb-8 space-y-1">
                        {filteredTasks.length === 0 && !isAdding ? (
                            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                                <div className="w-32 h-32 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                    <Check className="w-16 h-16 text-gray-200" />
                                </div>
                                <p className="text-lg font-medium text-gray-600">No hay tareas aún</p>
                                <p className="text-sm text-center max-w-xs mx-auto mt-1">Agrega tareas pendientes para llevar un seguimiento.</p>
                            </div>
                        ) : (
                            <>
                                {/* Pending Tasks */}
                                {filteredTasks.filter(t => !t.is_completed).map(task => (
                                    <div key={task.id} className="group flex items-start gap-3 p-3 hover:bg-gray-50 rounded-xl transition-colors cursor-default border border-transparent hover:border-gray-100">
                                        <button
                                            onClick={() => handleToggleComplete(task)}
                                            className="mt-1 w-5 h-5 rounded-full border-2 border-gray-400 hover:border-blue-500 hover:bg-blue-50 flex items-center justify-center transition-all flex-shrink-0"
                                        >
                                        </button>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-gray-800 text-base font-medium leading-snug">{task.title}</p>
                                            {task.description && <p className="text-gray-500 text-sm mt-0.5">{task.description}</p>}
                                            {selectedList === null && task.property_id && (
                                                <span className="text-xs text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md mt-1 inline-block font-medium">
                                                    {properties.find(p => p.id === task.property_id)?.name}
                                                </span>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => handleDeleteTask(task.id)}
                                            className="md:opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}

                                {/* Completed Tasks */}
                                {filteredTasks.filter(t => t.is_completed).length > 0 && (
                                    <>
                                        <div className="h-px bg-gray-100 my-6" />
                                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2 px-2">Completadas ({filteredTasks.filter(t => t.is_completed).length})</h3>
                                        {filteredTasks.filter(t => t.is_completed).map(task => (
                                            <div key={task.id} className="group flex items-start gap-3 p-3 hover:bg-gray-50 rounded-xl transition-colors cursor-default opacity-60">
                                                <button
                                                    onClick={() => handleToggleComplete(task)}
                                                    className="mt-1 w-5 h-5 rounded-full bg-blue-100 border-2 border-blue-500 flex items-center justify-center transition-colors flex-shrink-0"
                                                >
                                                    <Check className="w-3 h-3 text-blue-600" />
                                                </button>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-gray-500 text-base leading-snug line-through decoration-gray-400">{task.title}</p>
                                                </div>
                                                <button
                                                    onClick={() => handleDeleteTask(task.id)}
                                                    className="md:opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
