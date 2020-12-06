import React, { useEffect } from 'react'
import {
	TimestreamQueryContextConsumer,
	TimestreamQueryContextType,
} from './TimestreamQueryContext'
import { QueryCommand } from '@aws-sdk/client-timestream-query'

const ShowTemp = ({
	timestreamQueryContext,
}: {
	timestreamQueryContext: TimestreamQueryContextType
}) => {
	useEffect(() => {
		let isMounted = true
		void timestreamQueryContext.client
			.send(
				new QueryCommand({
					QueryString: `SELECT * FROM "${timestreamQueryContext.db}"."${timestreamQueryContext.table}"`,
				}),
			)
			.then((res) => {
				if (isMounted) {
					console.log(res)
				}
			})
		return () => {
			isMounted = false
		}
	})
	return null
}

export const Temperature = () => (
	<TimestreamQueryContextConsumer>
		{(context) => (
			<>
				<ShowTemp timestreamQueryContext={context} />
			</>
		)}
	</TimestreamQueryContextConsumer>
)
