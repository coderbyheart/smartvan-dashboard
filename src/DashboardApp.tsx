import React, { useEffect, useState } from 'react'
import { Navbar, NavbarBrand, Button } from 'reactstrap'
import styled from 'styled-components'
import { Main, mobileBreakpoint } from './Styles'
import { withAuthenticator } from 'aws-amplify-react'
import Amplify, { Auth } from 'aws-amplify'
import type { CognitoUser } from 'amazon-cognito-identity-js'
import { Temperature } from './Temperature'
import {
	TimestreamQueryContextType,
	TimestreamQueryContext,
} from './TimestreamQueryContext'
import {
	DescribeEndpointsCommand,
	TimestreamQueryClient,
} from '@aws-sdk/client-timestream-query'
import type { Endpoint } from '@aws-sdk/types'

import '@aws-amplify/ui/dist/style.css'
import { TemperatureHistory } from './TemperatureHistory'

const region = import.meta.env.SNOWPACK_PUBLIC_AWS_REGION
const [db, table] = import.meta.env.SNOWPACK_PUBLIC_HISTORYTABLE_INFO.split('|')

console.log({ db, table })

Amplify.configure({
	Auth: {
		identityPoolId: import.meta.env.SNOWPACK_PUBLIC_AWS_COGNITO_IDENTITYPOOL_ID,
		region,
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

export const DashboardApp = withAuthenticator(
	({ authData }: { authData: CognitoUser }) => {
		const [
			timestreamQueryContext,
			setTimestreamQueryContext,
		] = useState<TimestreamQueryContextType>()

		useEffect(() => {
			if (!authData) return
			Auth.currentCredentials()
				.then(async (creds) => {
					const c = Auth.essentialCredentials(creds)
					console.log(c)
					setTimestreamQueryContext({
						client: new TimestreamQueryClient({
							region,
							credentials: c,
							endpoint: async () =>
								new TimestreamQueryClient({
									region,
									credentials: c,
								})
									.send(new DescribeEndpointsCommand({}))
									.then((res) => {
										console.log(res)
										const { Endpoints } = res
										return (new URL(
											`https://${Endpoints?.[0].Address as string}`,
										) as unknown) as Endpoint
									}),
						}),
						db,
						table,
					})
				})
				.catch((error) => {
					console.error(error)
				})
		}, [authData])

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
				{timestreamQueryContext && (
					<TimestreamQueryContext.Provider value={timestreamQueryContext}>
						<Main>
							<Temperature />
							<TemperatureHistory />
						</Main>
					</TimestreamQueryContext.Provider>
				)}
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
