import React, { useEffect, useState } from 'react'
import {
	TimestreamQueryContextConsumer,
	TimestreamQueryContextType,
} from './TimestreamQueryContext'
import { QueryCommand } from '@aws-sdk/client-timestream-query'
import { parseResult } from '@bifravst/timestream-helpers'
import { formatDistanceToNow } from 'date-fns'
import styled from 'styled-components'

const MeasureValue = styled.p`
	font-size: 500%;
	small {
		font-size: 50%;
	}
`

const Measures = styled.section`
	display: flex;
	flex-direction: row;
	justify-content: space-around;
	text-align: center;
`

const Measure = ({
	value,
	time,
	label,
}: {
	value: number
	time: Date
	label: string
}) => {
	const [prefix, suffix] = value.toFixed(2).split('.')
	return (
		<div>
			<h2>{label}</h2>
			<MeasureValue>
				{prefix}
				{!/^00$/.test(suffix) && <small>.{suffix}</small>}
			</MeasureValue>
			<p>
				<small>
					<time dateTime={time.toISOString()}>
						{formatDistanceToNow(time, { addSuffix: true })}
					</time>
				</small>
			</p>
		</div>
	)
}

const ShowTemp = ({
	timestreamQueryContext,
}: {
	timestreamQueryContext: TimestreamQueryContextType
}) => {
	const [readings, setReadings] = useState<
		{
			name: string
			value: number
			time: Date
		}[]
	>([])
	useEffect(() => {
		let isMounted = true
		void Promise.all([
			timestreamQueryContext.client
				.send(
					new QueryCommand({
						QueryString: `SELECT measure_name as name, measure_value::double as value, time FROM "${timestreamQueryContext.db}"."${timestreamQueryContext.table}" WHERE measure_name IN ('inside', 'inside_rssi') ORDER BY time DESC LIMIT 10 `,
					}),
				)
				.then((res) =>
					parseResult<{
						name: string
						value: number
						time: Date
					}>(res as any),
				),
			timestreamQueryContext.client
				.send(
					new QueryCommand({
						QueryString: `SELECT measure_name as name, measure_value::double as value, time FROM "${timestreamQueryContext.db}"."${timestreamQueryContext.table}" WHERE measure_name IN ('outside', 'outside_rssi') ORDER BY time DESC LIMIT 10 `,
					}),
				)
				.then((res) =>
					parseResult<{
						name: string
						value: number
						time: Date
					}>(res as any),
				),
		]).then(([inside, outside]) => {
			if (isMounted) {
				setReadings([...inside, ...outside])
				console.log(
					JSON.stringify(
						{
							inside,
							outside,
						},
						null,
						2,
					),
				)
			}
		})
		return () => {
			isMounted = false
		}
	}, [timestreamQueryContext])
	const inside = readings.find(({ name }) => name === 'inside')
	const outside = readings.find(({ name }) => name === 'outside')
	const insideRssi = readings.find(({ name }) => name === 'inside_rssi')
	const outsideRssi = readings.find(({ name }) => name === 'outside_rssi')
	return (
		<>
			{(inside || outside) && (
				<Measures>
					{inside && (
						<Measure
							value={inside.value}
							time={inside.time}
							label="Inside °C"
						/>
					)}
					{outside && (
						<Measure
							value={outside.value}
							time={outside.time}
							label="Outside °C"
						/>
					)}
				</Measures>
			)}
			{(insideRssi || outsideRssi) && (
				<Measures>
					{insideRssi && (
						<Measure
							value={insideRssi.value}
							time={insideRssi.time}
							label="Inside RSSI"
						/>
					)}
					{outsideRssi && (
						<Measure
							value={outsideRssi.value}
							time={outsideRssi.time}
							label="Outside RSSI"
						/>
					)}
				</Measures>
			)}
		</>
	)
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
