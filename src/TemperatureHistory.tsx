import React, { useEffect, useRef, useState } from 'react'
import { Chart } from 'chart.js'
import styled from 'styled-components'
import { format } from 'date-fns'
import {
	TimestreamQueryContextConsumer,
	TimestreamQueryContextType,
} from './TimestreamQueryContext'
import { QueryCommand } from '@aws-sdk/client-timestream-query'
import { parseResult } from '@bifravst/timestream-helpers'

const Canvas = styled.canvas`
	width: 100%;
`

// Colors: https://colorswall.com/palette/326/

type Reading = { inside: number; outside: number; time: Date }

const TemperatureChart = ({ readings }: { readings: Reading[] }) => {
	const ref = useRef<HTMLCanvasElement>(null)
	const [chart, setChart] = useState<Chart>()

	if (ref.current !== null && chart === undefined) {
		const ctx = ref.current.getContext('2d') as CanvasRenderingContext2D
		setChart(
			new Chart(ctx, {
				type: 'line',
				data: {
					labels: readings.map(({ time }) => format(time, 'EEEEEE d.LL. H:00')),
					datasets: [
						{
							label: 'Inside',
							backgroundColor: '#28b4c8',
							borderColor: '#186A77',
							fill: false,
							data: readings.map(({ inside }) => Math.round(inside * 10) / 10),
							spanGaps: true,
						},
						{
							label: 'Outside',
							backgroundColor: '#78D237',
							borderColor: '#40741A',
							fill: false,
							data: readings.map(
								({ outside }) => Math.round(outside * 10) / 10,
							),
							spanGaps: true,
						},
					],
				},
				options: {
					responsive: true,
					scales: {
						xAxes: [
							{
								display: true,
								scaleLabel: {
									display: true,
									labelString: 'Hour',
								},
							},
						],
						yAxes: [
							{
								display: true,
								scaleLabel: {
									display: true,
									labelString: 'Temperature',
								},
							},
						],
					},
				},
			}),
		)
	}

	return <Canvas ref={ref} width="400" height="250" />
}

const LoadTemperatureHistory = ({
	timestreamQueryContext,
}: {
	timestreamQueryContext: TimestreamQueryContextType
}) => {
	const [readings, setReadings] = useState<Reading[]>([])

	useEffect(() => {
		let isMounted = true
		void timestreamQueryContext.client
			.send(
				new QueryCommand({
					QueryString: `
                        SELECT AVG(
                            CASE WHEN measure_name = 'inside' THEN measure_value::double ELSE NULL END
                        ) AS inside,
                        AVG(
                            CASE WHEN measure_name = 'outside' THEN measure_value::double ELSE NULL END
                        ) AS outside, bin(time, 1h) as time 
                        FROM "${timestreamQueryContext.db}"."${timestreamQueryContext.table}" 
                        WHERE measure_name IN ('inside', 'outside') AND time > ago(7d) GROUP BY bin(time, 1h) ORDER BY bin(time, 1h) ASC`,
				}),
			)
			.then((res) => parseResult<Reading>(res as any))
			.then((readings) => {
				if (isMounted) {
					setReadings(readings)
				}
			})
		return () => {
			isMounted = false
		}
	}, [timestreamQueryContext])

	return <TemperatureChart readings={readings} />
}

export const TemperatureHistory = () => (
	<TimestreamQueryContextConsumer>
		{(context) => <LoadTemperatureHistory timestreamQueryContext={context} />}
	</TimestreamQueryContextConsumer>
)
