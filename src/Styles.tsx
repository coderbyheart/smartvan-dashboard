import styled from 'styled-components'

export const mobileBreakpoint = '600px'

export const Main = styled.main`
	@media (min-width: ${mobileBreakpoint}) {
		max-width: ${mobileBreakpoint};
		margin: 2rem auto;
	}
`
