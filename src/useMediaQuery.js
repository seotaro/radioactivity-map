import { useEffect, useState } from 'react'

export const mediaQuery = {
  smartphone: 'width < 752px',
  tablet: '752px <= width < 1122px',
  pc: '1122px <= width',
}

export const useMediaQuery = (query) => {
  const formattedQuery = `(${query})`
  const [match, setMatch] = useState(matchMedia(formattedQuery).matches)

  useEffect(() => {
    const mediaQueryList = matchMedia(formattedQuery)

    if (mediaQueryList.media === 'not all' || mediaQueryList.media === 'invalid') {
      console.error(`useMediaQuery Error: Invalid media query`)
    }

    mediaQueryList.onchange = (e) => {
      setMatch(e.matches)
    }

    return () => {
      mediaQueryList.onchange = null
    }
  }, [formattedQuery, setMatch])

  return match
}