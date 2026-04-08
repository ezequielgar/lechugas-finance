import { useState } from 'react'
import { RouterProvider } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { httpBatchLink } from '@trpc/client'
import { router } from './router'
import { trpc } from './lib/trpc'
import { queryClient } from './lib/queryClient'
import { useAuthStore } from './store/authStore'
import { AuthRefresher } from './components/shared/AuthRefresher'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

function App() {

  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: `${API_URL}/api/trpc`,
          headers() {
            const currentToken = useAuthStore.getState().accessToken
            return currentToken
              ? { Authorization: `Bearer ${currentToken}` }
              : {}
          },
          fetch(url, options) {
            return fetch(url, { ...options, credentials: 'include' })
          },
        }),
      ],
    }),
  )

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <AuthRefresher />
        <RouterProvider router={router} />
      </QueryClientProvider>
    </trpc.Provider>
  )
}

export default App
