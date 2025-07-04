import DefaultTheme from 'vitepress/theme'
import './custom.css'

// if (typeof window !== 'undefined') {
//     const authorizedDomains = [
//       'staging.registresecurite.com',
//     ]
  
//     const referer = document.referrer
    
  
//     const isAuthorized =
//       authorizedDomains.some(domain => referer.startsWith(domain)) ||
//       sessionStorage.getItem('access_granted') === 'true'
  
//     if (isAuthorized) {
//       sessionStorage.setItem('access_granted', 'true')
//       setTimeout(() => sessionStorage.removeItem('access_granted'), 60 * 60 * 1000) // 1h
//     } else {
//       document.body.innerHTML = '<h1>Accès refusé</h1>'
//     }
//   }

export default DefaultTheme