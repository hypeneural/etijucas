import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Create{{Model}}Input, Update{{Model}}Input } from '../schema';

export const {{model}}Keys = {
  all: ['{{feature}}', '{{modelPlural}}'] as const,
  list: (filters?: unknown) => [...{{model}}Keys.all, 'list', filters] as const,
  detail: (id: string) => [...{{model}}Keys.all, 'detail', id] as const,
};

export function use{{Model}}ListQuery(filters?: unknown) {
  return useQuery({
    queryKey: {{model}}Keys.list(filters),
    queryFn: async () => {
      throw new Error('TODO: Integrate with @repo/sdk');
    },
  });
}

export function use{{Model}}Query(id: string) {
  return useQuery({
    queryKey: {{model}}Keys.detail(id),
    queryFn: async () => {
      throw new Error('TODO: Integrate with @repo/sdk');
    },
    enabled: !!id,
  });
}

export function useCreate{{Model}}Mutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: Create{{Model}}Input) => {
      throw new Error('TODO: Integrate with @repo/sdk');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: {{model}}Keys.list() });
    },
  });
}

export function useUpdate{{Model}}Mutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Update{{Model}}Input }) => {
      throw new Error('TODO: Integrate with @repo/sdk');
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: {{model}}Keys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: {{model}}Keys.list() });
    },
  });
}

export function useDelete{{Model}}Mutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      throw new Error('TODO: Integrate with @repo/sdk');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: {{model}}Keys.list() });
    },
  });
}
