import { useMemo } from 'react'
import { ApolloProvider } from '@apollo/client'
import { initializeApollo } from '../lib/apolloClient'

export default function App({ Component, pageProps }) {
  // const apolloClient = useApollo(pageProps.initialApolloState)
  const initialState = pageProps.initialApolloState
  const apolloClient = useMemo(() => initializeApollo(initialState), [initialState])

  return (
    <ApolloProvider client={apolloClient}>
      <Component {...pageProps} />
    </ApolloProvider>
  )
}
