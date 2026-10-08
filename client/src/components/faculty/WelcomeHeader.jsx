import useAuth from '../../hooks/useAuth';

const WelcomeHeader = () => {
  const { user } = useAuth();

  const name = user?.name ?? 'Faculty';
  const dept = user?.department ?? null;

  // Format time greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="mb-6">
      <p className="text-sm font-medium text-blue-700">{greeting}</p>
      <h1 className="mt-0.5 text-2xl font-bold text-slate-900 sm:text-3xl">
        Welcome, Prof. {name}
      </h1>
      {dept && (
        <p className="mt-1 text-sm text-slate-500">{dept}</p>
      )}
      <p className="mt-1 text-sm text-slate-500">
        Here&apos;s what&apos;s happening with your classes today.
      </p>
    </div>
  );
};

export default WelcomeHeader;
