import React, { useState, useEffect } from 'react';
import moment from 'moment';

function App() {

  const [name, setName] = useState('');
  const [searchDate, setSearchDate] = useState('')
  const [playerData, setPlayerData] = useState([])
  const [dataPerDay, setDataPerDay] = useState([])
  const [points, setPoints] = useState(0)
  const [inputValue, setInputValue] = useState({
    clanName: "",
    date: "",
    requirement: ""
  })
  const [members, setMembers] = useState([])
  const [scoreList, setScoreList] = useState([])
  const [redMembers, setredMembers] = useState([])

  const handleClanChange = (e) => {
    setInputValue( prev => ({
      ...prev,
      clanName: e.target.value
    }))
  }

  const handleDateChange = (e) => {
    setInputValue( prev => ({
      ...prev,
      date: e.target.value
    }))
  }

  const handleRequirementChange = (e) => {
    setInputValue( prev => ({
      ...prev,
      requirement: e.target.value
    }))
  }

  const fetchTotalScores = async() => {
    const clan = inputValue.clanName.toLocaleLowerCase()
    const membersResponse = await fetch(`https://robloxproxy.andreybusinessacc6675.workers.dev/usernames/${clan}`)
    if (!membersResponse.ok) {
      throw new Error("Failed to fetch members")
    }
    const membersList = await membersResponse.json()

    setMembers(membersList)
    let scoredMembers = []
    let redMembersL = []
    for (const member of membersList) {
      const scoreResponse = await fetch(`https://api.petsimulatorclans.com/${clan}/${member.id}`)
      if (!scoreResponse.ok) {
        throw new Error("Failed to fetch member data")
      }
      const scoreData = await scoreResponse.json()
      const date_range = getTimeRange(inputValue.date)
      const score = getOneDayData(date_range, scoreData)
      const meet = score - inputValue.requirement >= 0
      const diff = inputValue.requirement - score
      if ( !meet ) {
        const exist = redMembers.some(item => item.id === member.id)
        if (!exist) {
          redMembersL.push({ ...member, score: score, pass: meet, diff: diff })
        }
      }
      const exist = scoreList.some(item => item.id === member.id)
      if (!exist) {
        // scoreList.push(member_a)
        scoredMembers.push({ ...member, score: score, pass: meet })
      }
      // scoredMembers.push({ ...member, score: score })
    }
    setScoreList(scoredMembers)
    setredMembers(redMembersL)
  }

  const getTimeRange = (date) => {
    const start = date + "00:00:00.000"
    const end = date + "24:00:00.000"
    const start_res = moment(start, moment.HTML5_FMT.DATETIME_LOCAL_MS, 'America/New_York').utc().format(moment.HTML5_FMT.DATETIME_LOCAL_MS) + 'Z'
    const end_res = moment(end, 'YYYY-MM-DDTHH:mm:ss.SSS', 'America/New_York').utc().format(moment.HTML5_FMT.DATETIME_LOCAL_MS) + 'Z'
    // console.log(" check start ")
    // console.log(start_res)
    return { start_res, end_res }
  }

  const getOneDayData = (date, data) => {
    const start = new Date(date.start_res)
    const end = new Date(date.end_res)
    let per_data = []
    // let sum = 0
    data.forEach((d) => {
      const d_date = new Date(d.timestamp)
      const compare_s = d_date >= start
      const compare_e = d_date < end
      // console.log(compare_s)
      if (compare_s && compare_e) {
        // sum = sum + d.Points
        per_data.push(d)
      }
    })
    // setPoints(sum)
    // setDataPerDay(per_data)
    const minPoints = Math.min(...per_data.map(item => item.Points))
    const maxPoints = Math.max(...per_data.map(item => item.Points))
    return maxPoints - minPoints
  }


  return (
    <div className="App">
      <div>
        <input 
            type="text" 
            name="clanName" 
            placeholder="Enter Clan"
            value={inputValue.clanName} 
            onChange={handleClanChange}
          />
        <input 
          type="text" 
          name="date" 
          placeholder="YYYY-MM-DD"
          value={inputValue.date} 
          onChange={handleDateChange}
        />
        <input 
          type="text" 
          name="requirement" 
          placeholder="Enter Daily Reuirement"
          value={inputValue.requirement} 
          onChange={handleRequirementChange}
        />
      </div>
      <button onClick={fetchTotalScores}>Search</button>
      <div>
        { scoreList.length !== 0 && scoreList.map((member, i) => (
          <div key={member.id} style={{ backgroundColor: member.pass ? "white" : "red"}}>
            {member.name} - {member.score}
          </div>
        ))}
      </div>
      <div>
        ==============================================================================================
        ==============================================================================================
        ================================       UnSatisfied Members      ==============================

      </div>
      <div>
        { redMembers.length !== 0 && redMembers.map((member, i) => (
          <div key={i}>
            {member.name} - {member.score}   need to grind: <span style={{ color: "red"}}> {member.diff}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
