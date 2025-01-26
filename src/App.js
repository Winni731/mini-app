import React, { useState, useEffect } from 'react';
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
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid2';
import happy from './happy.jpg'
import sad from './sad.jpg'
import champion from './star_champion.png'
import player from './player.png'
import clans from './clans.webp'

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
    name: '',
    battle: '',
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
    const clanResponse = await fetch(`https://api.petsimulatorclans.com/${clan}`)
    if (!clanResponse.ok) {
      console.log(" cannot fetch clan status ")
      throw new Error("Failed to fetch clan status")
    }
    const clanStatus = await clanResponse.json()
    const date_range = getTimeRange(inputValue.date)
    const clanData = getOneDayClanData(date_range, clanStatus)
    let tempPointsList1
    let memberRecords = []
    membersList.forEach( m => {
      const obj = Object.entries(m)
      memberRecords.push(obj[0][1])
    })
    const tempPointsList = clanData.maxPointItem.data.PointContributions

    const maxPointsList = tempPointsList.filter( m => memberRecords.includes(m.UserID))
    if (date_range.search_date === '2025-01-25') {
      const start_points = []
      maxPointsList.forEach( m => {
        const m_start = { UserID: m.UserID, Points: 0}
        start_points.push(m_start)
      })
      tempPointsList1 = start_points
    }
    else {
      tempPointsList1 = clanData.minPointItem.data.PointContributions
    }

    const minPointsList = tempPointsList1.filter( m => memberRecords.includes(m.UserID))

    maxPointsList.forEach( (m, index) => {
      if (!minPointsList[index]) {
        const new_m = {UserID: m.UserID, Points: 0}
        // console.log(new_m + " new created")
        minPointsList.push(new_m)       
      }
    })

    const clanDailyPoints = date_range.search_date === '2025-01-25' ?  clanData.maxPointItem.data.Points : clanData.maxPointItem.data.Points - clanData.minPointItem.data.Points
    const battleName = clanData.maxPointItem.data.BattleID
    const place = clanData.maxPointItem.data.Place
    let userIds = []
    const memberAvg = (clanDailyPoints / (membersList.length)).toFixed(2)

    for (var i=0; i<maxPointsList.length; i++) {
      const max = Object.entries(maxPointsList[i])
      const min = Object.entries(minPointsList[i])
      if ( max[0][0] === 'UserID' && max[0][1] === min[0][1] && memberRecords.includes(max[0][1]) ) {
        const daily_points = max[1][1] - min[1][1]
        const userNameResponse = await fetch(`https://robloxproxy.andreybusinessacc6675.workers.dev/proxy/user/?userID=${max[0][1]}`)
          if (!userNameResponse.ok) {
            console.log(" cannot find username with id: " + member.UserID)
            throw new Error("Failed to fetch member details data")
          }
        const userInfo = await userNameResponse.json()        
        var img = new Image()
        img.src = `https://ihateproxies.andreybusinessacc6675.workers.dev/user/image/${max[0][1]}`
        const meet = daily_points - inputValue.requirement >= 0
        const diff = Math.abs(inputValue.requirement - daily_points)
        const member = { UserId: max[0][1], totalPoint: max[1][1], score: daily_points, avatar: img.src, name: userInfo.name}
        if ( !meet ) {
          const exist = redMembers.some(item => item.id === member.id)
          if (!exist) {
            redMembersL.push({ ...member, pass: meet, diff: diff })
          }
        }
        const exist = scoreList.some(item => item.id === member.id)
        if (!exist) {
          scoredMembers.push({ ...member, pass: meet, diff: diff })
        }
        // const member = { UserId: max[0][1], totalPoint: max[1][1], dailyPoint: daily_points, avatar: img.src, name: userInfo.name}
        userIds.push(max[0][1])
      }
    }
    const memberMeetRequriemnts = scoredMembers.length - redMembersL.length
    // const UserResponse = await fetch('https://users.roblox.com/v1/users', {
    //   method: 'POST',
    //   headers: {
    //    'Content-Type': 'application/json;charset=utf-8',
    //    'Access-Control-Allow-Origin':'*'
    //   }, 
    //   body: JSON.stringify({
    //     "userIds": userIds,
    //     "excludeBannedUsers": true
    //   }) 
    // })
    // const UserNames = await UserResponse.json()
    // console.log(UserNames)
    scoredMembers.sort((a, b) => b.score - a.score)
    redMembersL.sort((a, b) => b.score - a.score)
    setScoreList(scoredMembers)
    setredMembers(redMembersL)
    setClanStatus({
      name: inputValue.clanName,
      battle: battleName,
      place: place,
      totalPoints: clanData.maxPointItem.data.Points,
      dailyPoints: clanDailyPoints,
      memberAvg: memberAvg,
      memberMeetRequriemnts: memberMeetRequriemnts    
    })
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
    return { start_res, end_res, search_date }
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

  const getOneDayClanData = (date, data) => {
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
    const minPointItem = per_data.reduce((min, current) => {
      return current.data.Points < min.data.Points ? current : min
    })
    const maxPointItem = per_data.reduce((max, current) => {
      return current.data.Points > max.data.Points ? current : max
    })
    return { minPointItem, maxPointItem }
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
    setFilteredList(filteredItems)
    
  }


  return (
    <div className="App">
      <Card>
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
        { clanStatus.name && <Card style={{margin: '15px', backgroundColor: '#ededed'}}>
          <Grid container spacing={2} alignItems='flex-end' margin='15px' fontFamily='Roboto, Helvetica, Arial, sans-serif'>
              <div style={{padding: '12px'}}>
              <Grid item xs={6}>
                <Avatar src={clans} style={{ width: '36px', height: '36px'}}/>
                </Grid>
              </div>
              <div style={{ backgroundColor: "#b0e0e6", borderRadius: '10px', padding: '21px'}}>           
                <Grid item xs={6} fontWeight='bold' textAlign='center'>
                  {clanStatus.name.toUpperCase()}
                </Grid>
              </div>
              <div style={{ backgroundColor: "#b0e0e6", borderRadius: '10px', padding: '10px'}}>
              <Grid item xs={6}>
                  <span style={{ fontStyle: 'italic', textAlign:'center'}}>{clanStatus.battle}</span>
                </Grid>   
              <Grid item xs={6} fontWeight='bold'>
              <span style={{display: 'flex'}}>
              &nbsp;
              <span><Avatar src={champion} style={{ width: '22px', height: '22px'}}/></span>
              <span>#&nbsp;{clanStatus.place}&nbsp;</span>
              </span>
              </Grid>
                </div>
              <div style={{ backgroundColor: "#b0e0e6", borderRadius: '10px', padding: '12px'}}>
                <Grid item xs={6}>
                  <span style={{ fontStyle: 'italic', textAlign:'center'}}>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Total</span>
                </Grid>  
                <Grid item xs={6}>
                  <span style={{display: 'flex'}}>
                  <span><Avatar src={star} style={{ width: '16px', height: '16px'}}/></span>
                  <span>&nbsp;{clanStatus.totalPoints}&nbsp;</span>
                  </span> 
              </Grid> 
              </div>
              <div style={{ backgroundColor: "#b0e0e6", borderRadius: '10px', padding: '12px'}}>
                <Grid item xs={6}>
                <span style={{ fontStyle: 'italic', textAlign:'center'}}>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Daily</span>
                </Grid>
              <Grid item xs={6}>
              <span style={{display: 'flex'}}>
              <span><Avatar src={star} style={{ width: '16px', height: '16px'}}/></span>
              <span>&nbsp;{clanStatus.dailyPoints}&nbsp;</span>
              </span>
              </Grid>
              </div>
              <div style={{ backgroundColor: "#b0e0e6", borderRadius: '10px', padding: '12px'}}>
              <Grid item xs={6}>
                <span style={{ fontStyle: 'italic', textAlign:'center'}}>&nbsp;Member Avg</span>
                </Grid>
                <Grid item xs={6}>
              <span style={{display: 'flex'}}>
              <span><Avatar src={star} style={{ width: '16px', height: '16px'}}/></span>
              <span>&nbsp;{clanStatus.memberAvg}&nbsp;&nbsp;</span>
              &nbsp;&nbsp;
              </span>
              </Grid>
              </div>
              <div style={{ backgroundColor: "#b0e0e6", borderRadius: '10px', padding: '12px'}}>
              <Grid item xs={6}>
                <span style={{ fontStyle: 'italic', textAlign:'center'}}>Meet Daily Req</span>
                </Grid>
              <Grid item xs={6}>
                <span style={{display: 'flex'}}>
              <span><Avatar src={player} style={{ width: '16px', height: '16px'}}/></span>
              <span><Avatar src={player} style={{ width: '16px', height: '16px'}}/></span>
                <span>&nbsp;&nbsp;{clanStatus.memberMeetRequriemnts}&nbsp;&nbsp;</span>
                </span>
              </Grid>
              </div>
              </Grid>
          </Card>}
        { filteredList.length !== 0 && filteredList.length !== scoreList.length && filteredList.map((member, i) => (
          <React.Fragment key={i}>
          <ListItem alignItems="flex-start" key={`key-` + i} style={{ margin: '5px', backgroundColor: "#b0e0e6"}}>
             <Avatar src={member.avatar} style={{marginTop: '10px', marginLeft: '30px'}}/>
             <ListItemText 
             primary={<span style={{display: 'flex', margin: '5px'}}>
             <span>{member.name}&nbsp;</span>
             { member.pass && <span><Avatar src={happy} style={{ width: '25px', height: '25px'}} key={i}/></span>}
             { !member.pass && <span><Avatar src={sad} style={{ width: '25px', height: '25px'}} key={i}/></span>}
             </span>}
             secondary={
              <span style={{display: 'flex'}}>
              <span><Avatar src={star} style={{ width: '16px', height: '16px'}} key={i}/></span>
              <span>&nbsp;{member.score}</span>
              <span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>
              <span style={{ backgroundColor: member.pass ? "#eee8aa" : "pink", borderRadius: '10px'}}>&nbsp;{member.diff}&nbsp;</span>
              </span>
             }
             />
          </ListItem>
          {/* {(scoreList.length-16===i) && <Divider>BOTTOM 15 MEMBERS</Divider>} */}
          </React.Fragment>
        ))}
        <List sx={{ bgcolor: 'background.paper'}}>
        { !loading && scoreList.length !== 0 && scoreList.map((member, i) => (
          <React.Fragment key={i}>
          <ListItem alignItems="flex-start" key={`key-` + i} style={{ margin: '5px', backgroundColor: member.pass ? "#ededed" : "pink"}}>
             <h4>#{i+1}&nbsp;</h4>
             <Avatar src={member.avatar} style={{marginTop: '5px'}}/>
             <ListItemText 
             primary={<span style={{display: 'flex'}}>
             <span>&nbsp;{member.name}&nbsp;</span>
             { i===0 && <span><Avatar src={first} style={{ width: '25px', height: '25px'}} key={i}/></span>}
             { i===1 && <span><Avatar src={second} style={{ width: '25px', height: '25px'}} key={i}/></span>}
             { i===2 && <span><Avatar src={third} style={{ width: '25px', height: '25px'}} key={i}/></span>}
             </span>}
             secondary={
              <span style={{display: 'flex'}}>
                &nbsp;&nbsp;
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
