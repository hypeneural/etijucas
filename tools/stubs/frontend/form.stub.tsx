import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';

import { create{{Model}}Schema, type Create{{Model}}Input } from '../schema';

type {{Model}}FormProps = {
  defaultValues?: Partial<Create{{Model}}Input>;
  onSubmit: (values: Create{{Model}}Input) => void | Promise<void>;
};

export function {{Model}}Form({ defaultValues, onSubmit }: {{Model}}FormProps) {
  const form = useForm<Create{{Model}}Input>({
    resolver: zodResolver(create{{Model}}Schema),
    defaultValues,
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
{{formFields}}
        <Button type="submit">Save</Button>
      </form>
    </Form>
  );
}
