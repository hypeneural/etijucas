import { {{Model}}Form } from '../components/{{Model}}Form';
import { useCreate{{Model}}Mutation } from '../api/{{model}}';

export default function {{Model}}CreatePage() {
  const mutation = useCreate{{Model}}Mutation();

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Create {{Model}}</h1>
      <{{Model}}Form onSubmit={(values) => mutation.mutate(values)} />
    </div>
  );
}
