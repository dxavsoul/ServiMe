import { UseFormReturn } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

interface AdminUserStepProps {
  form: UseFormReturn<any>;
}

export function AdminUserStep({ form }: AdminUserStepProps) {
  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="admin_user.full_name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Full Name</FormLabel>
            <FormControl>
              <Input placeholder="John Doe" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="admin_user.email"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Admin Email</FormLabel>
            <FormControl>
              <Input type="email" placeholder="admin@company.com" {...field} />
            </FormControl>
            <FormDescription>
              This will be used to log in to your account
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="admin_user.password"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Password</FormLabel>
            <FormControl>
              <Input type="password" placeholder="••••••••" {...field} />
            </FormControl>
            <FormDescription>
              Must be at least 8 characters long
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="admin_user.confirm_password"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Confirm Password</FormLabel>
            <FormControl>
              <Input type="password" placeholder="••••••••" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
