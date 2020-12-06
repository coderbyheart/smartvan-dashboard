import React, { useEffect, useState } from 'react'
import { Navbar, NavbarBrand, Button } from 'reactstrap'
import styled from 'styled-components'
import { Main, mobileBreakpoint } from './Styles'
import { withAuthenticator } from 'aws-amplify-react'
import Amplify, { Auth } from 'aws-amplify'
import type { CognitoUser } from 'amazon-cognito-identity-js'

import '@aws-amplify/ui/dist/style.css'

Amplify.configure({
	Auth: {
		identityPoolId: import.meta.env.SNOWPACK_PUBLIC_AWS_COGNITO_IDENTITYPOOL_ID,
		region: import.meta.env.SNOWPACK_PUBLIC_AWS_REGION,
		userPoolId: import.meta.env.SNOWPACK_PUBLIC_AWS_COGNITO_USERPOOL_ID,
		userPoolWebClientId: import.meta.env
			.SNOWPACK_PUBLIC_AWS_USERPOOL_WEBCLIENT_ID,
		mandatorySignIn: true,
	},
})

const StyledNavbar = styled(Navbar)`
	@media (min-width: ${mobileBreakpoint}) {
		max-width: ${mobileBreakpoint};
		margin: 0 auto;
	}
`

export const AuthDataContext = React.createContext<{ identityId?: string }>({})

export const DashboardApp = withAuthenticator(
	({ authData }: { authData: CognitoUser }) => {
		const [identityId, setIdentityId] = useState<string>()

		useEffect(() => {
			void Auth.currentCredentials().then(async ({ identityId }) => {
				setIdentityId(identityId)
			})
		})

		return (
			<>
				<header className="bg-light">
					<StyledNavbar color="light" light>
						<NavbarBrand href="/">SmartVan</NavbarBrand>
						<Button
							onClick={async () => {
								await Auth.signOut()
								window.location.reload()
							}}
						>
							Logout
						</Button>
					</StyledNavbar>
				</header>
				<AuthDataContext.Provider value={{ identityId }}>
					<Main>
						<h1>Woot!</h1>
						<AuthDataContext.Consumer>
							{({ identityId }) => identityId}
						</AuthDataContext.Consumer>
					</Main>
				</AuthDataContext.Provider>
			</>
		)
	},
	({
		usernameAttributes: 'email',
		signUpConfig: {
			hiddenDefaults: ['phone_number'],
		},
	} as unknown) as boolean, // FIXME: remove hack to allow configuration
)
