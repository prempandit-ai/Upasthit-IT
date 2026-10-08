import RoleBadge from "./RoleBadge";

const ProfileCard = ({ user, tokenExpiry, jwtValid, protectedRouteStatus }) => {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-600 text-xl font-bold text-white">
          {user?.name?.charAt(0)?.toUpperCase() || "U"}
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900">{user?.name}</h2>
          <p className="text-sm text-slate-500">{user?.email}</p>
          <div className="mt-2">
            <RoleBadge role={user?.role} />
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            JWT Status
          </p>
          <p
            className={`mt-1 text-sm font-medium ${jwtValid ? "text-emerald-600" : "text-red-600"}`}
          >
            {jwtValid ? "Valid" : "Expired / Invalid"}
          </p>
          {tokenExpiry ? (
            <p className="mt-1 text-xs text-slate-400">
              Expires: {tokenExpiry.toLocaleString()}
            </p>
          ) : null}
        </div>

        <div className="rounded-xl bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Protected Route
          </p>
          <p
            className={`mt-1 text-sm font-medium ${protectedRouteStatus === "Verified" ? "text-emerald-600" : protectedRouteStatus === "Denied" ? "text-red-600" : "text-amber-600"}`}
          >
            {protectedRouteStatus}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProfileCard;
