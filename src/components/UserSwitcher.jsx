export default function UserSwitcher({ role, onRoleChange }) {
  return (
    <div className="role-switcher-group">
      <span className="role-label">View as:</span>
      <button
        type="button"
        className={`role-btn seller ${role === "User1" ? "active" : ""}`}
        onClick={() => onRoleChange("User1")}
      >
        🏪 Seller
      </button>
      <button
        type="button"
        className={`role-btn buyer ${role === "User2" ? "active" : ""}`}
        onClick={() => onRoleChange("User2")}
      >
        🛍 Buyer
      </button>
    </div>
  );
}
