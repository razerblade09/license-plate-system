document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('addForm');
    const tableBody = document.querySelector('#vehicleTable tbody');

    // Auto-format license plate input
    document.getElementById('plate').addEventListener('input', function(e) {
        this.value = this.value.toUpperCase().replace(/\s/g, '');
    });

    // Load initial data
    loadVehicles();

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const vehicle = {
            plate: document.getElementById('plate').value.replace(/\s/g, ''),
            owner: document.getElementById('owner').value.trim(),
            model: document.getElementById('model').value.trim(),
            color: document.getElementById('color').value.trim()
        };

        if (!validateInput(vehicle)) return;

        const response = await fetch('/api/cars', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(vehicle)
        });

        handleResponse(response);
    });

    async function loadVehicles() {
        try {
            const response = await fetch('/api/cars');
            const result = await response.json();
            
            if (!response.ok) {
                console.error('Server Response:', result);
                throw new Error('Failed to fetch vehicles');
            }
    
            tableBody.innerHTML = result.map(vehicle => `
                <tr>
                    <td>${vehicle.plate_number}</td>
                    <td>${vehicle.owner_name}</td>
                    <td>${vehicle.car_model}</td>
                    <td>${vehicle.car_color}</td>
                    <td class="status-${vehicle.current_status.toLowerCase()}">
                        ${vehicle.current_status}
                    </td>
                    <td class="date-cell">${new Date(vehicle.registration_date).toLocaleDateString()}</td>
                    <td class="date-cell">${new Date(vehicle.expiration_date).toLocaleDateString()}</td>
                    <td>
                        <span class="action-btn renew-btn" onclick="renewVehicle('${vehicle.plate_number}')">↻</span>
                        <span class="action-btn edit-btn" onclick="showEditForm('${vehicle.plate_number}')">✎</span>
                        <span class="action-btn delete-btn" onclick="deleteVehicle('${vehicle.plate_number}')">✕</span>
                    </td>
                </tr>
            `).join('');
        } catch (error) {
            console.error('Error loading vehicles:', error);
            Swal.fire('Error!', 'Failed to load vehicles', 'error');
        }
    }    

    function validateInput(vehicle) {
        if (!vehicle.plate || vehicle.plate.length < 3) {
            Swal.fire('Error!', 'License plate must be at least 3 characters', 'error');
            return false;
        }
        if (!vehicle.owner || !vehicle.model || !vehicle.color) {
            Swal.fire('Error!', 'All fields are required', 'error');
            return false;
        }
        return true;
    }

    async function handleResponse(response) {
        try {
            const result = await response.json();
            if (response.ok) {
                Swal.fire('Success!', 'Operation completed successfully', 'success');
                form.reset();
                loadVehicles();

                // Smooth scroll to the top after adding a vehicle
                smoothScrollToTop();
            } else {
                Swal.fire('Error!', result.error || 'Operation failed', 'error');
            }
        } catch (error) {
            console.error('Error handling response:', error);
            Swal.fire('Error!', 'An unexpected error occurred', 'error');
        }
    }

    // Smooth scroll to the top of the page
    function smoothScrollToTop() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'  // Smooth scroll effect
        });
    }

    // Renew functionality
    window.renewVehicle = async (plate) => {
        try {
            const { isConfirmed } = await Swal.fire({
                title: 'Confirm Renewal',
                text: `Renew vehicle ${plate} for 1 year?`,
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#2b8a3e',
                confirmButtonText: 'Renew'
            });

            if (isConfirmed) {
                const response = await fetch(`/api/cars/${plate}/renew`, { method: 'PUT' });
                handleResponse(response);
            }
        } catch (error) {
            console.error('Error renewing vehicle:', error);
            Swal.fire('Error!', 'Failed to renew vehicle', 'error');
        }
    };

    // Edit functionality
    window.showEditForm = async (plate) => {
        try {
            const response = await fetch(`/api/cars/${plate}`);
            if (!response.ok) {
                throw new Error('Failed to fetch vehicle details');
            }
            const vehicle = await response.json();

            const { value: formValues } = await Swal.fire({
                title: 'Edit Vehicle',
                html: `
                    <input id="edit-owner" class="swal2-input" value="${vehicle.owner_name}">
                    <input id="edit-model" class="swal2-input" value="${vehicle.car_model}">
                    <input id="edit-color" class="swal2-input" value="${vehicle.car_color}">
                `,
                focusConfirm: false,
                showCancelButton: true,
                preConfirm: () => {
                    return {
                        owner: document.getElementById('edit-owner').value.trim(),
                        model: document.getElementById('edit-model').value.trim(),
                        color: document.getElementById('edit-color').value.trim()
                    };
                }
            });

            if (formValues) {
                const updateResponse = await fetch(`/api/cars/${plate}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formValues)
                });
                handleResponse(updateResponse);
            }
        } catch (error) {
            console.error('Error editing vehicle:', error);
            Swal.fire('Error!', 'Failed to edit vehicle', 'error');
        }
    };

    // Delete functionality
    window.deleteVehicle = async (plate) => {
        try {
            const { isConfirmed } = await Swal.fire({
                title: 'Confirm Delete',
                text: `Delete vehicle ${plate}? This cannot be undone!`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#c92a2a',
                confirmButtonText: 'Delete'
            });

            if (isConfirmed) {
                const response = await fetch(`/api/cars/${plate}`, { method: 'DELETE' });
                handleResponse(response);
            }
        } catch (error) {
            console.error('Error deleting vehicle:', error);
            Swal.fire('Error!', 'Failed to delete vehicle', 'error');
        }
    };

    async function handleGuest(plate) {
        try {
            const { isConfirmed } = await Swal.fire({
                title: 'Register Guest',
                text: `Would you like to register the guest vehicle ${plate}?`,
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#2b8a3e',
                confirmButtonText: 'Register'
            });
    
            if (isConfirmed) {
                const { value: formValues } = await Swal.fire({
                    title: 'Register Guest Vehicle',
                    html: `
                        <input id="guest-owner" class="swal2-input" placeholder="Owner Name">
                        <input id="guest-model" class="swal2-input" placeholder="Car Model">
                        <input id="guest-color" class="swal2-input" placeholder="Car Color">
                    `,
                    focusConfirm: false,
                    showCancelButton: true,
                    preConfirm: () => {
                        return {
                            owner: document.getElementById('guest-owner').value.trim(),
                            model: document.getElementById('guest-model').value.trim(),
                            color: document.getElementById('guest-color').value.trim()
                        };
                    }
                });
    
                if (formValues) {
                    const response = await fetch(`/api/guests/${plate}/register`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(formValues)
                    });
                    handleResponse(response);
                }
            }
        } catch (error) {
            console.error('Error handling guest:', error);
            Swal.fire('Error!', 'Failed to handle guest', 'error');
        }
    }
    
    async function checkGuestAccess(plate) {
        try {
            const response = await fetch(`/api/guests/check-access?plate=${plate}`);
            const result = await response.json();
            return result.access;
        } catch (error) {
            console.error('Error checking guest access:', error);
            return false;
        }
    }
});