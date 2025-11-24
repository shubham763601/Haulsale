import '../styles/globals.css'
import NavBar from '../components/NavBar' // correct path
export default function App({ Component, pageProps }) {
  return (
    <>
      <NavBar />
      <Component {...pageProps} />
    </>
  )
}