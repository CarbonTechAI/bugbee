'use client';

export default function LogoutButton() {
    const handleLogout = () => {
        if (confirm('Are you sure you want to logout?')) {
            localStorage.removeItem('bugbee_token');
            window.location.reload();
        }
    };

    return (
        <button
            onClick={handleLogout}
            className="text-red-400 hover:text-red-300 transition-colors text-xs font-medium"
        >
            Logout
        </button>
    );
}
