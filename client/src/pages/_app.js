import '../styles/globals.css'

function MyApp({ Component, pageProps }) {
  return (
    <div className="iphone-frame">
      <div className="iphone-screen">
        <Component {...pageProps} />
      </div>
    </div>
  )
}

export default MyApp
