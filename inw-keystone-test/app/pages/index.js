import gql from 'graphql-tag'
import Link from 'next/link'
import { useQuery } from '@apollo/client'
import { initializeApollo } from '../lib/apolloClient'

// queries like: https://www.keystonejs.com/guides/intro-to-graphql
const IndexQuery = gql`
  query IndexQuery {
    configs: allConfigs(where: { isActiveConfig: true }) {
      radioActive
      radioStreamUrl
    }

    audioItems: allAudioItems(first: 10) {
      name
      audioType
      soundcloudUrl
      date
      mainImage {
        id
        publicUrl
      }
      body {
        id
        document
      }
    }
  }
`

const Index = () => {
  const { loading, error, data } = useQuery(IndexQuery)
  console.log(data)

  return (
    <div>
      {loading && 'Loading...'}

      OK now I now what this is. goto{' '}
      <Link href="/about">
        <a>static</a>
      </Link>{' '}
      page.
    </div>
  )
}

export async function getStaticProps() {
  const apolloClient = initializeApollo()

  await apolloClient.query({
    query: IndexQuery,
  })

  return {
    props: {
      initialApolloState: apolloClient.cache.extract(),
    },
    unstable_revalidate: 1,
  }
}

export default Index
