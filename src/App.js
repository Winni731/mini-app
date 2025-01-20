import React, { useState, useEffect } from 'react';
import moment from 'moment';
import { ListItemAvatar, ListItemText, TextField, List, ListItem, Divider } from '@mui/material';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';

function App() {

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
    const membersResponse = await fetch(`https://ps99.biggamesapi.io/api/clan/${clan}`)
    if (!membersResponse.ok) {
      throw new Error("Failed to fetch members")
    }
    // const membersList = await membersResponse.json()
    const clanInfo = await membersResponse.json()
    const membersList = clanInfo.data.Members

    setMembers(membersList)
    let scoredMembers = []
    let redMembersL = []
    for (const member of membersList) {
      try {
        const scoreResponse = await fetch(`https://api.petsimulatorclans.com/${clan}/${member.UserID}`)
        if (!scoreResponse.ok) {
          console.log(" cannot fetch member: " + member.UserID)
          throw new Error("Failed to fetch member data")
        }
        const scoreData = await scoreResponse.json()
        const date_range = getTimeRange(inputValue.date)
        const score = getOneDayData(date_range, scoreData)
        const meet = score - inputValue.requirement >= 0
        const diff = inputValue.requirement - score
        const userNameResponse = await fetch(`https://robloxproxy.andreybusinessacc6675.workers.dev/proxy/user/?userID=${member.UserID}`)
        if (!userNameResponse.ok) {
          console.log(" cannot find username with id: " + member.UserID)
          throw new Error("Failed to fetch member details data")
        }
        const userInfo = await userNameResponse.json()
        
        var img = new Image()
        img.src = `https://ihateproxies.andreybusinessacc6675.workers.dev/user/image/${member.UserID}`
        if ( !meet ) {
          const exist = redMembers.some(item => item.id === member.id)
          if (!exist) {
            redMembersL.push({ ...member, score: score, pass: meet, diff: diff, name: userInfo.name, avatar: img.src})
          }
        }
        const exist = scoreList.some(item => item.id === member.id)
        if (!exist) {
          scoredMembers.push({ ...member, score: score, pass: meet, name: userInfo.name, avatar: img.src })
        }
      }
      catch(error) {
        const score = "No Data Found From petsimulatorclans"
        const exist = scoreList.some(item => item.id === member.id)
        const exist_not_meet = redMembersL.some(item => item.id === member.id)
        if (!exist) {
          scoredMembers.push({ ...member, score: score, pass: false, name: member.id})
        }
        if (!exist_not_meet) {
          redMembersL.push({ ...member, score: score, pass: false, name: member.id})
        }
        console.log(error)
      }
    }
    scoredMembers.sort((a, b) => b.score - a.score)
    redMembersL.sort((a, b) => b.score - a.score)
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
      <div style={{ display: 'flex' }}>
        <TextField
            sx={{ margin: '2px'}}
            size="small"
            type="text" 
            name="clanName" 
            placeholder="Enter Clan"
            value={inputValue.clanName} 
            onChange={handleClanChange}
          />
        <TextField 
          sx={{ margin: '2px'}}
          size="small"
          type="text" 
          name="date" 
          placeholder="YYYY-MM-DD"
          value={inputValue.date} 
          onChange={handleDateChange}
        />
        <TextField 
          sx={{ margin: '2px'}}
          size="small"
          type="text" 
          name="requirement" 
          placeholder="Enter Daily Reuirement"
          value={inputValue.requirement} 
          onChange={handleRequirementChange}
        />
        <Button variant="contained" onClick={fetchTotalScores} sx={{ margin: '2px'}}>Search</Button>
      </div>
      <div>
        <List sx={{ bgcolor: 'background.paper'}}>
        { scoreList.length !== 0 && scoreList.map((member, i) => (
          <ListItem alignItems="flex-start" key={member.id} style={{ margin: '5px', backgroundColor: member.pass ? "white" : "pink"}}>
             <Avatar src={member.avatar} />
             {/* {member.name} : <span>{member.score}</span> */}
             <ListItemText 
             primary={member.name}
             secondary={
              member.score
             }
             />
             <Divider variant="inset" component="li" />
          </ListItem>
        ))}
        </List>
      </div>
      <div>

        ================================       UnSatisfied Members      ==============================

      </div>
      <div>
        { redMembers.length !== 0 && redMembers.map((member, i) => (
          <div key={i} style={{ margin: '5px'}}>
            <span>{member.name}</span>:  <span>{member.score}</span>   ========= need to grind: <span style={{ color: "red"}}> {member.diff}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
