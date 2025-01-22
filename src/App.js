import React, { useState, useEffect, useRef } from 'react';
import moment from 'moment-timezone';
import { ListItemText, TextField, List, ListItem, Divider, CircularProgress } from '@mui/material';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import star from './gold_star_1_outline.png'
import first from './icon_medal_gold.png'
import second from './icon_medal_emerald_old.png'
import third from './icon_medal_bronze.png'
import cry from './cry.png'
// import EnableColorOnDarkAppBar from './AppBar';
import Paper from '@mui/material/Paper';
import Card from '@mui/material/Card';
import SearchAppBar from './SearchBar';

function App() {
  const [inputValue, setInputValue] = useState({
    clanName: "",
    date: "",
    requirement: ""
  })
  const [scoreList, setScoreList] = useState([])
  const [redMembers, setredMembers] = useState([])
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(false)
  const [clanStatus, setClanStatus] = useState({
    place: 0,
    totalPoints: 0,
    dailyPoints: 0,
    memberAvg: 0,
    memberMeetRequriemnts: 0
  })
  const [filteredList, setFilteredList] = useState([])

  const handleClanChange = (e) => {
    setInputValue( prev => ({
      ...prev,
      clanName: e.target.value
    }))
  }

  const handleDateChange = (e) => {
    const value = e.target.value
    setInputValue( prev => ({
      ...prev,
      date: value
    }))
    if (!validateDate(value)) {
      setError(true)
    }
    else {
      setError(false)
    }
  }

  const handleRequirementChange = (e) => {
    setInputValue( prev => ({
      ...prev,
      requirement: e.target.value
    }))
  }

  const fetchTotalScores = async() => {
    setLoading(true)
    const clan = inputValue.clanName.toLocaleLowerCase()
    const membersResponse = await fetch(`https://ps99.biggamesapi.io/api/clan/${clan}`)
    if (!membersResponse.ok) {
      throw new Error("Failed to fetch members")
    }
    const clanInfo = await membersResponse.json()
    const membersList = clanInfo.data.Members
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
    setLoading(false)
  }


  const getTimeRange = (date) => {
    const timeZone = 'America/New_York'
    const localTZ = moment.tz.guess()
    const localTime = moment(new Date().toLocaleTimeString(), 'hh:mm:ss A').format('HH:mm:ss')
    const dateTime = date + ` ${localTime}`
    const localDateTime = moment.tz(dateTime, 'YYYY-MM-DD HH:mm:ss', localTZ)
    const ESTDateTime = localDateTime.clone().tz(timeZone)
    const search_date = ESTDateTime.format('YYYY-MM-DD')
    const start = moment.tz(search_date, timeZone).startOf('day')
    const end = moment.tz(search_date, timeZone).endOf('day')
    const start_res = start.utc()
    const end_res = end.utc()
    return { start_res, end_res }
  }

  const getOneDayData = (date, data) => {
    const start = new Date(date.start_res)
    const end = new Date(date.end_res)
    let per_data = []
    data.forEach((d) => {
      const d_date = new Date(d.timestamp)
      const compare_s = d_date >= start
      const compare_e = d_date < end
      if (compare_s && compare_e) {
        per_data.push(d)
      }
    })
    const minPoints = Math.min(...per_data.map(item => item.Points))
    const maxPoints = Math.max(...per_data.map(item => item.Points))
    return maxPoints - minPoints
  }

  const validateDate = (value) => {
    const regex = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/
    if (!regex.test(value)) {
      return false
    }

    const [year, month, day] = value.split('-').map(Number)
    const date = new Date(year, month-1, day)
    return (
      date.getFullYear() === year &&
      date.getMonth() === month -1 &&
      date.getDate() === day
    )
  }

  const handleSearch = (filteredItems) => {
    if (filteredItems.length !== 0) {
      setFilteredList(filteredItems)
    }
    else {
      setFilteredList([])
    }

  }

  console.log("===========")
  console.log(filteredList)

  return (
    <div className="App">
      <Card>
      {/* <EnableColorOnDarkAppBar /> */}
      <SearchAppBar sx={{ display: 'flex'}}
        list={scoreList}
        onSearch={handleSearch}
      />
      <div style={{ display: 'flex', margin: '10px'}}>
        <TextField
            sx={{ margin: '5px'}}
            size="small"
            type="text" 
            name="clanName" 
            label="Clan Name"
            variant="outlined"
            disabled={loading}
            value={inputValue.clanName} 
            onChange={handleClanChange}
          />
        <TextField 
          sx={{ margin: '5px'}}
          size="small"
          type="text" 
          name="date" 
          label="YYYY-MM-DD"
          variant="outlined"
          disabled={loading}
          value={inputValue.date} 
          error={error}
          helperText={error ? "Invalid Date Format, Require YYYY-MM-DD" : ""}
          onChange={handleDateChange}
        />
        <TextField 
          sx={{ margin: '5px'}}
          size="small"
          type="text" 
          name="requirement" 
          variant="outlined"
          label="Daily Reuirement"
          disabled={loading}
          value={inputValue.requirement} 
          onChange={handleRequirementChange}
        />
        <Button variant="contained" onClick={fetchTotalScores} sx={{ margin: '5px'}} disabled={loading || !(inputValue.clanName && inputValue.date)}>Search</Button>
      </div>
      <div>
        { loading && <CircularProgress sx={{ margin: '20px', size: '10rem'}}/>}
        { filteredList.length !== 0 && filteredList.length !== scoreList.length && filteredList.map((member, i) => (
          <React.Fragment key={i}>
          <ListItem alignItems="flex-start" key={`key-` + i} style={{ margin: '5px', backgroundColor: "#b0e0e6"}}>
             <Avatar src={member.avatar} />
             <ListItemText 
             primary={<span style={{display: 'flex'}}>
             <span>{member.name}&nbsp;</span>
             { i===0 && <span><Avatar src={first} style={{ width: '25px', height: '25px'}} key={i}/></span>}
             { i===1 && <span><Avatar src={second} style={{ width: '25px', height: '25px'}} key={i}/></span>}
             { i===2 && <span><Avatar src={third} style={{ width: '25px', height: '25px'}} key={i}/></span>}
             </span>}
             secondary={
              <span style={{display: 'flex'}}>
              <span><Avatar src={star} style={{ width: '16px', height: '16px'}} key={i}/></span>
              <span>&nbsp;{member.score}</span>
              </span>
             }
             />
             {/* <Divider /> */}
          </ListItem>
          {(scoreList.length-16===i) && <Divider>BOTTOM 15 MEMBERS</Divider>}
          </React.Fragment>
        ))}
        <List sx={{ bgcolor: 'background.paper'}}>
        { !loading && scoreList.length !== 0 && scoreList.map((member, i) => (
          <React.Fragment key={i}>
          <ListItem alignItems="flex-start" key={`key-` + i} style={{ margin: '5px', backgroundColor: member.pass ? "#ededed" : "pink"}}>
             <h4>#{i+1}&nbsp;</h4>
             <Avatar src={member.avatar} />
             <ListItemText 
             primary={<span style={{display: 'flex'}}>
             <span>{member.name}&nbsp;</span>
             { i===0 && <span><Avatar src={first} style={{ width: '25px', height: '25px'}} key={i}/></span>}
             { i===1 && <span><Avatar src={second} style={{ width: '25px', height: '25px'}} key={i}/></span>}
             { i===2 && <span><Avatar src={third} style={{ width: '25px', height: '25px'}} key={i}/></span>}
             </span>}
             secondary={
              <span style={{display: 'flex'}}>
              <span><Avatar src={star} style={{ width: '16px', height: '16px'}} key={i}/></span>
              <span>&nbsp;{member.score}</span>
              </span>
             }
             />
             {/* <Divider /> */}
          </ListItem>
          {(scoreList.length-16===i) && <Divider>BOTTOM 15 MEMBERS</Divider>}
          </React.Fragment>
        ))}
        </List>
      </div>
      <Divider>UNSATISFIED MEMBERS</Divider>
      <List sx={{ bgcolor: 'background.paper'}}>
        {!loading &&  redMembers.length !== 0 && redMembers.map((member, i) => (
          <ListItem key={i} style={{ margin: '5px'}}>
            <Avatar src={cry} />
            <span>{member.name}</span>:&nbsp;<span style={{ backgroundColor: '#ededed'}}>{member.score}</span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style={{ fontStyle: 'italic'}}>need to grind:</span>&nbsp;<span style={{ color: "red"}}>{member.diff}</span>
          </ListItem>
        ))}
      </List>
      </Card>
    </div>
  );
}

export default App;
