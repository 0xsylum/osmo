import { Web3Provider } from '@/contexts/Web3Provider'
import { Toaster } from 'react-hot-toast'
import '@/styles/globals.css'

export default function App({ Component, pageProps }) {
  return (
    <Web3Provider>
      <Component {...pageProps} />
      <Toaster 
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#1e293b',
            color: 'white',
            border: '1px solid #334155'
          }
        }}
      />
    </Web3Provider>
  )
}