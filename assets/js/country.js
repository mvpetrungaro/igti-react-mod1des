const api = axios.create({ baseURL: 'https://api.covid19api.com/' })
const numberFormat = Intl.NumberFormat('pt-BR')

const elCountries = document.getElementById('cmbCountry')
const elDateStart = document.getElementById('date_start')
const elDateEnd = document.getElementById('date_end')
const elData = document.getElementById('cmbData')
const elLinhas = document.getElementById('linhas')
const elFilter = document.getElementById('filtro')
const elKpiConfirmed = document.getElementById('kpiconfirmed')
const elKpiDeaths = document.getElementById('kpideaths')
const elKpiRecovered = document.getElementById('kpirecovered')

let chLinhas = null

function dateFormatUTC(date, withHours = true) {
    if (typeof date === 'string') date = new Date(date)
    
    const day = date.getUTCDate().toString().padStart(2, '0')
    const month = (date.getUTCMonth() + 1).toString().padStart(2, '0')
    const year = date.getUTCFullYear()
    const hours = date.getUTCHours()
    const minutes = date.getUTCMinutes()
    
    let formatted = `${day}/${month}/${year}`

    if (withHours) formatted += ` ${hours}:${minutes}`

    return formatted
}

function dateFormatISO(date, withHours = true) {
    if (typeof date === 'string') date = new Date(date)
    
    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const year = date.getFullYear().toString().padStart(4, '0')
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    const seconds = date.getSeconds().toString().padStart(2, '0')
    
    let formatted = `${year}-${month}-${day}T`

    if (withHours) formatted += `${hours}:${minutes}:${seconds}`
    else formatted += '00:00:00'

    formatted += 'Z'

    return formatted
}

window.addEventListener('load', async () => {
    const res = await api.get('countries')
    let countries = res.data.sort((a, b) => a.Country.localeCompare(b.Country))

    countries.map(c => new Option(c.Country, c.Slug, c.ISO2 === 'BR', c.ISO2 === 'BR'))
    .forEach(opt => elCountries.appendChild(opt))

    elFilter.addEventListener('click', onFilter)

    onFilter()
})

async function onFilter() {
    Promise.all([
        loadChart(),
        loadKpi()
    ])
}

async function loadChart() {
    let filter = ''

    if (elDateStart.value) {
        let from = new Date(elDateStart.value)
        from.setDate(from.getDate() - 1)

        filter += `?from=${from.toISOString()}`

        if (!elDateEnd.value) {
            let today = new Date(dateFormatISO(new Date(), false))
            today.setDate(today.getDate() + 1)
            
            filter += `&to=${today.toISOString()}`
        }
    }

    if (elDateEnd.value) {
        if (!elDateStart.value) {
            let minDate = new Date(dateFormatISO(elDateStart.min, false))
            minDate.setDate(minDate.getDate() - 1)

            filter += `?from=${minDate.toISOString()}`
        }

        filter += `&to=${new Date(elDateEnd.value).toISOString()}`
    }

    const country = `country/${elCountries.value}${filter}`
    const res = await api.get(country)
    
    let dataByDay = res.data
    dataByDay.forEach((v, i, a) => {
        if (i > 0) {
            v.ConfirmedToday = v.Confirmed - a[i - 1].Confirmed
            if (v.ConfirmedToday < 0) v.ConfirmedToday = 0
            v.DeathsToday = v.Deaths - a[i - 1].Deaths
            if (v.DeathsToday < 0) v.DeathsToday = 0
            v.RecoveredToday = v.Recovered - a[i - 1].Recovered
            if (v.RecoveredToday < 0) v.RecoveredToday = 0
        }
    })
    dataByDay = dataByDay.slice(1)

    const data = dataByDay.map(dt => dt[`${elData.value}Today`])
    const mean = _.mean(data)

    // elKpiConfirmed.innerHTML = _.sum(dataByDay.map(d => d.ConfirmedToday))
    // elKpiDeaths.innerHTML = _.sum(dataByDay.map(d => d.DeathsToday))
    // elKpiRecovered.innerHTML = _.sum(dataByDay.map(d => d.RecoveredToday))

    if (chLinhas) chLinhas.destroy()
    
    chLinhas = new Chart(elLinhas, {
        type: 'line',
        data: {
            labels: dataByDay.map(d => dateFormatUTC(d.Date, false)),
            datasets: [{
                label: `Número de ${elData.selectedOptions.item(0).text}`,
                data,
                borderWidth: 1,
                borderColor: '#FF8800'
            }, {
                label: `Média de ${elData.selectedOptions.item(0).text}`,
                data: data.map(() => mean),
                borderWidth: 1,
                borderColor: '#AA0000'
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                title: {
                    display: true,
                    text: 'Curva diária de Covid-19'
                }
            }
        }
    })
}

async function loadKpi() {
    elKpiConfirmed.innerHTML = ''
    elKpiDeaths.innerHTML = ''
    elKpiRecovered.innerHTML = ''

    const summary = await api.get('summary')
    const countrySummary = summary.data.Countries.find(c => c.Slug === elCountries.value)

    if (countrySummary) {
        elKpiConfirmed.innerHTML = numberFormat.format(countrySummary.TotalConfirmed)
        elKpiDeaths.innerHTML = numberFormat.format(countrySummary.TotalDeaths)
        elKpiRecovered.innerHTML = numberFormat.format(countrySummary.TotalRecovered)
    }
}