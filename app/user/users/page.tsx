import AdminUsersPage from "@/app/components/Admin/Users/UsersPage";
import { UserType } from "@/app/generated/prisma";
import authOptions from "@/lib/auth/authOptions";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

const UsersPage = async () => {
  const session = await getServerSession(authOptions);

  if (!session || session.user.type !== UserType.Admin) {
    redirect("/user/dashboard");
  }

  return (
    <div className="flex-1 pt-25">
      <div className="bg-base-100 shadow-br rounded-xl">
        <AdminUsersPage />
      </div>
    </div>
  );
};

export default UsersPage;
