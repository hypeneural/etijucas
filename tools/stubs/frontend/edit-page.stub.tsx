import { useParams } from 'react-router-dom';
import { {{Model}}Form } from '../components/{{Model}}Form';
import { useUpdate{{Model}}Mutation } from '../api/{{model}}';

export default function {{Model}}EditPage() {
  const { id } = useParams<{ id: string }>();
  const mutation = useUpdate{{Model}}Mutation();

  if (!id) {
    return <div>Missing {{model}} id</div>;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Edit {{Model}}</h1>
      <{{Model}}Form onSubmit={(values) => mutation.mutate({ id, payload: values })} />
    </div>
  );
}
