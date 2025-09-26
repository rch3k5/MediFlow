// App.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
// --- A-STEP CHANGE ---
// Import the toast library for notifications
import { Toaster, toast } from 'react-hot-toast';

// --- Configuration ---
// Ensure this is the correct public URL for your DEPLOYED backend service
const API_BASE_URL = 'https://ymeruzfyf6.us-east-2.awsapprunner.com';


// --- Main App Component ---
export default function App() {
    const [patients, setPatients] = useState([]);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [observations, setObservations] = useState([]);
    const [view, setView] = useState('list'); // 'list', 'detail', 'add'
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isObservationModalOpen, setIsObservationModalOpen] = useState(false);


    useEffect(() => {
        fetchPatients();
    }, []);

    const fetchPatients = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get(`${API_BASE_URL}/patients`);
            setPatients(response.data);
        } catch (err) {
            console.error("Failed to fetch patients:", err);
            setError('Failed to connect to the API. Is the backend server running with CORS configured?');
            // --- A-STEP CHANGE ---
            toast.error("Could not connect to the API.");
        } finally {
            setLoading(false);
        }
    };

    const fetchObservations = async (patientId) => {
        try {
            const response = await axios.get(`${API_BASE_URL}/patients/${patientId}/observations`);
            setObservations(response.data);
        } catch (err) {
            console.error("Failed to fetch observations:", err);
            setError('Failed to load patient observations.');
            // --- A-STEP CHANGE ---
            toast.error("Failed to load patient observations.");
        }
    };

    const handleSelectPatient = (patient) => {
        setSelectedPatient(patient);
        fetchObservations(patient._id);
        setView('detail');
    };

    const handleAddPatient = async (patientData) => {
        try {
            await axios.post(`${API_BASE_URL}/patients`, patientData);
            // --- A-STEP CHANGE ---
            toast.success('Patient created successfully!');
            await fetchPatients(); // Refresh the list
            setView('list');
        } catch (err) {
            console.error("Failed to add patient:", err);
            setError('Failed to add patient. Please check the data and try again.');
            // --- A-STEP CHANGE ---
            toast.error('Failed to add patient.');
        }
    };

    const handleAddObservation = async (observationData) => {
        if (!selectedPatient) return;
        try {
            const dataToSend = { ...observationData, patient_id: selectedPatient._id };
            await axios.post(`${API_BASE_URL}/patients/${selectedPatient._id}/observations`, dataToSend);
            // --- A-STEP CHANGE ---
            toast.success('Observation added successfully!');
            await fetchObservations(selectedPatient._id); // Refresh the observations list
            setIsObservationModalOpen(false); // Close the modal on success
        } catch (err) {
            console.error("Failed to add observation:", err);
            // --- A-STEP CHANGE ---
            // Replaced the old alert() with a toast notification
            toast.error('Failed to add observation.');
        }
    };


    const renderContent = () => {
        // --- A-STEP CHANGE ---
        // Show a spinner component while loading
        if (loading) return <Spinner />;
        if (error && view === 'list') return <div className="text-center p-8 text-red-500 bg-red-100 rounded-lg">{error}</div>;

        switch (view) {
            case 'detail':
                return <PatientDetail
                    patient={selectedPatient}
                    observations={observations}
                    onBack={() => setView('list')}
                    onAddObservation={() => setIsObservationModalOpen(true)}
                />;
            case 'add':
                return <AddPatientForm onSubmit={handleAddPatient} onCancel={() => setView('list')} />;
            case 'list':
            default:
                return <PatientList patients={patients} onSelectPatient={handleSelectPatient} onAddPatient={() => setView('add')} />;
        }
    };

    return (
        <div className="bg-slate-50 min-h-screen font-sans text-slate-800">
            {/* --- A-STEP CHANGE --- */}
            {/* This component is required for toast notifications to appear */}
            <Toaster position="top-center" reverseOrder={false} />

            <header className="bg-white shadow-sm sticky top-0 z-10">
                <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-sky-600">MediFlow</h1>
                </div>
            </header>
            <main className="container mx-auto px-4 py-8">
                {renderContent()}
            </main>

            {isObservationModalOpen && (
                <AddObservationModal
                    onSubmit={handleAddObservation}
                    onCancel={() => setIsObservationModalOpen(false)}
                />
            )}
        </div>
    );
}

// --- Child Components ---

// --- A-STEP CHANGE ---
// A new, simple spinner component for loading states
function Spinner() {
    return (
        <div className="flex justify-center items-center p-10">
            <div className="w-10 h-10 border-4 border-slate-200 border-t-sky-500 rounded-full animate-spin"></div>
        </div>
    );
}


function PatientList({ patients, onSelectPatient, onAddPatient }) {
    // ... (This component has no changes)
    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Patient Roster</h2>
                <button onClick={onAddPatient} className="bg-sky-500 hover:bg-sky-600 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                    + Add Patient
                </button>
            </div>
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <ul className="divide-y divide-slate-200">
                    {patients.length > 0 ? patients.map(patient => (
                        <li key={patient._id} onClick={() => onSelectPatient(patient)} className="p-4 hover:bg-slate-50 cursor-pointer flex justify-between items-center">
                            <div>
                                <p className="font-semibold">{patient.first_name} {patient.last_name}</p>
                                <p className="text-sm text-slate-500">MRN: {patient.mrn}</p>
                            </div>
                            <span className="text-slate-400">&#8250;</span>
                        </li>
                    )) : <li className="p-4 text-center text-slate-500">No patients found.</li>}
                </ul>
            </div>
        </div>
    );
}

function PatientDetail({ patient, observations, onBack, onAddObservation }) {
    // ... (This component has no changes)
    return (
        <div>
            <button onClick={onBack} className="mb-6 text-sky-600 hover:text-sky-800 font-semibold">&larr; Back to List</button>
            <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h2 className="text-2xl font-bold mb-1">{patient.first_name} {patient.last_name}</h2>
                <p className="text-slate-500">MRN: {patient.mrn}</p>
                <p className="text-slate-500">DOB: {new Date(patient.date_of_birth).toLocaleDateString()}</p>
            </div>

            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Observations</h3>
                <button onClick={onAddObservation} className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm">
                    + Add Observation
                </button>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <ul className="divide-y divide-slate-200">
                    {observations.length > 0 ? observations.map(obs => (
                        <li key={obs._id} className="p-4 grid grid-cols-3 gap-4">
                            <p className="font-semibold">{obs.type}</p>
                            <p>{obs.value} {obs.unit}</p>
                            <p className="text-sm text-slate-500 text-right">{new Date(obs.timestamp).toLocaleString()}</p>
                        </li>
                    )) : <li className="p-4 text-center text-slate-500">No observations recorded for this patient.</li>}
                </ul>
            </div>
        </div>
    );
}

function AddPatientForm({ onSubmit, onCancel }) {
    // ... (This component has no changes)
    const [formData, setFormData] = useState({
        mrn: '',
        first_name: '',
        last_name: '',
        date_of_birth: '',
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <div className="max-w-lg mx-auto">
            <h2 className="text-xl font-semibold mb-6">Add New Patient</h2>
            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-4">
                <div>
                    <label htmlFor="mrn" className="block text-sm font-medium text-slate-700">MRN</label>
                    <input type="text" name="mrn" id="mrn" required onChange={handleChange} value={formData.mrn} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" />
                </div>
                <div>
                    <label htmlFor="first_name" className="block text-sm font-medium text-slate-700">First Name</label>
                    <input type="text" name="first_name" id="first_name" required onChange={handleChange} value={formData.first_name} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" />
                </div>
                <div>
                    <label htmlFor="last_name" className="block text-sm font-medium text-slate-700">Last Name</label>
                    <input type="text" name="last_name" id="last_name" required onChange={handleChange} value={formData.last_name} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" />
                </div>
                <div>
                    <label htmlFor="date_of_birth" className="block text-sm font-medium text-slate-700">Date of Birth</label>
                    <input type="date" name="date_of_birth" id="date_of_birth" required onChange={handleChange} value={formData.date_of_birth} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" />
                </div>
                <div className="flex justify-end space-x-3 pt-2">
                    <button type="button" onClick={onCancel} className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 px-4 rounded-lg transition-colors">
                        Cancel
                    </button>
                    <button type="submit" className="bg-sky-500 hover:bg-sky-600 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                        Save Patient
                    </button>
                </div>
            </form>
        </div>
    );
}

function AddObservationModal({ onSubmit, onCancel }) {
    // ... (This component has no changes)
    const [formData, setFormData] = useState({
        type: '',
        value: '',
        unit: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        await onSubmit(formData);
        setIsSubmitting(false);
    };

    return (
        // Modal backdrop
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center">
            {/* Modal content */}
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                <h2 className="text-xl font-semibold mb-6">Add New Observation</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="type" className="block text-sm font-medium text-slate-700">Observation Type</label>
                        <input type="text" name="type" id="type" required placeholder="e.g., Heart Rate" onChange={handleChange} value={formData.type} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500" />
                    </div>
                    <div>
                        <label htmlFor="value" className="block text-sm font-medium text-slate-700">Value</label>
                        <input type="text" name="value" id="value" required placeholder="e.g., 85" onChange={handleChange} value={formData.value} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500" />
                    </div>
                    <div>
                        <label htmlFor="unit" className="block text-sm font-medium text-slate-700">Unit</label>
                        <input type="text" name="unit" id="unit" required placeholder="e.g., bpm" onChange={handleChange} value={formData.unit} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500" />
                    </div>
                    <div className="flex justify-end space-x-3 pt-2">
                        <button type="button" onClick={onCancel} disabled={isSubmitting} className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50">
                            Cancel
                        </button>
                        <button type="submit" disabled={isSubmitting} className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                            {isSubmitting ? 'Saving...' : 'Save Observation'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

