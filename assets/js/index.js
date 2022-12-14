const api = axios.create({ baseURL: 'https://api.covid19api.com/' })
const numberFormat = Intl.NumberFormat('pt-BR')

const confirmed = document.getElementById('confirmed')
const death = document.getElementById('death')
const recovered = document.getElementById('recovered')
const date = document.getElementById('date')
const pizza = document.getElementById('pizza')
const barras = document.getElementById('barras')

function dateFormat(date) {
    if (typeof date === 'string') date = new Date(date)

    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const year = date.getFullYear()
    const hours = date.getHours()
    const minutes = date.getMinutes()
    
    return `${day}/${month}/${year} ${hours}:${minutes}`
}

window.addEventListener('load', async () => {
    let summary = await api.get('summary')

    confirmed.innerHTML += numberFormat.format(summary.data.Global.TotalConfirmed)
    death.innerHTML += numberFormat.format(summary.data.Global.TotalDeaths)
    recovered.innerHTML += numberFormat.format(summary.data.Global.TotalRecovered)
    date.innerHTML += ' ' + dateFormat(new Date(summary.data.Global.Date))

    new Chart(pizza, {
        type: 'pie',
        data: {
            labels: ['New confirmed', 'New deaths', 'New recovered'],
            datasets: [{
                data: [summary.data.Global.NewConfirmed, summary.data.Global.NewDeaths, summary.data.Global.NewRecovered],
                backgroundColor: ['#AA00AA', '#AAAA00', '#00AAAA']
            }]
        },
        options: {
            responsive: true,
            locale: 'pt-BR',
            plugins: {
                legend: {
                    position: 'top'
                },
                title: {
                    display: true,
                    text: 'New Cases Distribution'
                }
            }
        }
    })

    const topTenCountriesByDeath = summary.data.Countries.sort((a, b) => b.TotalDeaths - a.TotalDeaths).slice(0, 10)

    new Chart(barras, {
        type: 'bar',
        data: {
            labels: topTenCountriesByDeath.map(c => c.Country),
            datasets: [{
                label: 'Total deaths',
                data: topTenCountriesByDeath.map(c => c.TotalDeaths),
                backgroundColor: '#0000AA'
            }]
        },
        options: {
            responsive: true,
            locale: 'pt-BR',
            plugins: {
                title: {
                    display: true,
                    text: 'Total Deaths by Country - Top 10'
                }
            }
        }
    })
})