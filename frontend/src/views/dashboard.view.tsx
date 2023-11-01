import { useUserStore } from "../stores/user.store";

export default function Dashboard() {
  const { user } = useUserStore((state) => [state.user]);

  return (
    <div>
      <h1>Dashboard</h1>

      <span>{user?.email}</span>
    </div>
  );
}
