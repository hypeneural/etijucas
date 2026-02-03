import { use{{Model}}ListQuery } from '../api/{{model}}';

export default function {{Model}}ListPage() {
  const { data, isLoading, error } = use{{Model}}ListQuery();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Failed to load {{modelPlural}}</div>;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">{{Model}} List</h1>
      <pre className="text-xs bg-muted p-4 rounded">{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
