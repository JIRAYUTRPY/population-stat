import { useEffect, useState } from "react";
import { Chart as CHartJS } from "chart.js/auto";
import { Bar } from "react-chartjs-2";
import { createClient } from "@supabase/supabase-js";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Checkbox from "@mui/material/Checkbox";
import IconButton from "@mui/material/IconButton";
import Slider from "@mui/material/Slider";
import CircularProgress from "@mui/material/CircularProgress";
import Button from "@mui/material/Button";
import SendIcon from "@mui/icons-material/Send";
import TextField from "@mui/material/TextField";
import Stack from "@mui/material/Stack";
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_KEY
);
let interval = null;
function App() {
  const [checked, setChecked] = useState(["Thailand"]);
  const [allCountry, setAllCountry] = useState([]);
  const [countryName, setCountryName] = useState("");
  const [currentYear, setCurrentYear] = useState(2021);
  const [loading, setLoading] = useState(true);
  const [chartComponent, setChartComponent] = useState([]);
  const [cachData, setCachData] = useState([]);
  const [play, setPlay] = useState(false);
  const [total, setTotal] = useState(0);
  const handleAddToggle = (value) => () => {
    checked.push(value);
    clearInterval(interval);
    interval = null;
    if (play) {
      setPlay(false);
    }
    fetchAllRecord();
  };
  const handleRemoveToggle = (value) => () => {
    checked.splice(checked.indexOf(value), 1);
    clearInterval(interval);
    interval = null;
    if (play) {
      setPlay(false);
    }
    fetchAllRecord();
  };
  const setNewYear = (e) => {
    const newYear = e.target.value;
    setCurrentYear(newYear);
    let totalPop = 0;
    cachData
      .filter((value) => value.years === currentYear)
      .map((value) => (totalPop = totalPop + value.population_overall));
    setTotal(totalPop);
    clearInterval(interval);
    interval = null;
    if (play) {
      setPlay(false);
    }
  };
  const TimeLapse = () => {
    let yearCount = currentYear;
    if (!play) {
      if (!interval) {
        interval = setInterval(() => {
          if (yearCount < 2021) {
            setCurrentYear(yearCount);
            yearCount++;
          } else {
            setCurrentYear(2021);
            setPlay(false);
            clearInterval(interval);
            interval = null;
          }
          let totalPop = 0;
          cachData
            .filter((value) => value.years === yearCount)
            .map((value) => (totalPop = totalPop + value.population_overall));
          setTotal(totalPop);
        }, 100);
      }
      const newPlay = !play;
      setPlay(newPlay);
    } else {
      clearInterval(interval);
      interval = null;
      let totalPop = 0;
      cachData
        .filter((value) => value.years === currentYear)
        .map((value) => (totalPop = totalPop + value.population_overall));
      setTotal(totalPop);
      const newPlay = !play;
      setPlay(newPlay);
    }
  };
  const fetchingCountry = async () => {
    let { data, error } = await supabase.rpc("get_country_name");
    if (error) {
      console.log(error);
    } else {
      setAllCountry(
        data
          .map((data) => {
            return data.country_name;
          })
          .toSorted()
      );
    }
  };
  const fetchAllRecord = async () => {
    setLoading(true);
    let { data, error } = await supabase
      .from("populations")
      .select("*")
      .in("country_name", checked);
    setChartComponent([]);
    setCachData(data);
    let newChartComponent = [];
    for (let x = 1950; x <= 2021; x++) {
      const dataMaping = checked.map((ct) =>
        data.filter((value) => value.country_name === ct)
      );
      const dataFilter = dataMaping.map((dt) =>
        dt.filter((internal) => internal.years === x)
      );

      newChartComponent = [
        ...newChartComponent,
        {
          year: x,
          component: (
            <Bar
              options={{
                indexAxis: "y",
                animation: {
                  duration: 0, // general animation time
                },
              }}
              data={{
                labels: checked,
                datasets: [
                  {
                    label: "Poppulation",
                    data: dataFilter.map(
                      (value) => value[0].population_overall
                    ),
                  },
                ],
              }}
            />
          ),
        },
      ];
      let totalPop = 0;
      const tt = dataFilter.map((value) => value[0].population_overall);
      tt.map((value) => (totalPop = totalPop + value));
      setTotal(totalPop);
    }
    setChartComponent(newChartComponent);
    setLoading(false);
  };
  useEffect(() => {
    fetchingCountry();
    fetchAllRecord();
  }, []);
  return (
    <div className="w-screen h-screen flex justify-center bg-gray-400">
      <div className="flex flex-col w-[90%] pt-[2%] gap-3">
        <div className="w-full">
          <h1 className="text-2xl">
            Population growth per country, 1950 to 2021
          </h1>
        </div>
        <div className="w-full bg-white rounded-md h-[10%] p-5 flex items-center">
          <div className="pr-5">
            <TextField
              label="Serach Country"
              variant="outlined"
              onChange={(e) => setCountryName(e.target.value)}
            />
          </div>
          <Button variant="contained" onClick={TimeLapse}>
            {play ? "unplay" : "play"}
          </Button>
          <div className="w-[90%] px-10">
            <Slider
              defaultValue={2021}
              step={1}
              value={currentYear}
              onChange={setNewYear}
              max={2021}
              min={1950}
              valueLabelDisplay="on"
            />
          </div>
          <h1 className="w-[12%]">
            Population Total:{" "}
            <span className="text-2xl font-bold">{total}</span>
          </h1>
        </div>
        <div className="flex flex-row w-full h-[80%] gap-5">
          <div className="overflow-y-scroll min-w-[300px] w-[20%] overflow-x-hidden bg-white rounded-md hidescroll">
            <List>
              {checked.map((value, index) => {
                const labelId = `checkbox-list-label-${value}`;
                return (
                  <ListItem key={value}>
                    <ListItemButton
                      role={undefined}
                      onClick={handleRemoveToggle(value)}
                      dense
                    >
                      <ListItemIcon>
                        <Checkbox
                          edge="start"
                          checked
                          tabIndex={-1}
                          disableRipple
                          inputProps={{ "aria-labelledby": labelId }}
                        />
                      </ListItemIcon>
                      <ListItemText id={labelId} primary={`${value}`} />
                    </ListItemButton>
                  </ListItem>
                );
              })}
              {allCountry
                .filter((data) => checked.indexOf(data) === -1)
                .map((value, index) => {
                  const labelId = `checkbox-list-label-${value}`;
                  if (!countryName) {
                    return (
                      <ListItem key={value}>
                        <ListItemButton
                          role={undefined}
                          onClick={handleAddToggle(value)}
                        >
                          <ListItemIcon>
                            <Checkbox
                              edge="start"
                              tabIndex={-1}
                              disableRipple
                              inputProps={{ "aria-labelledby": labelId }}
                            />
                          </ListItemIcon>
                          <ListItemText id={labelId} primary={`${value}`} />
                        </ListItemButton>
                      </ListItem>
                    );
                  } else {
                    if (
                      value.toLowerCase().includes(countryName.toLowerCase())
                    ) {
                      return (
                        <ListItem key={value}>
                          <ListItemButton
                            role={undefined}
                            onClick={handleAddToggle(value)}
                            dense
                          >
                            <ListItemIcon>
                              <Checkbox
                                edge="start"
                                tabIndex={-1}
                                disableRipple
                                inputProps={{ "aria-labelledby": labelId }}
                              />
                            </ListItemIcon>
                            <ListItemText id={labelId} primary={`${value}`} />
                          </ListItemButton>
                        </ListItem>
                      );
                    } else {
                      return;
                    }
                  }
                })}
            </List>
          </div>
          <div className="w-full h-full bg-white rounded-md flex flex-col justify-center items-center p-3">
            {loading ? (
              <CircularProgress />
            ) : (
              chartComponent.map((chartCompoentData) => {
                return (
                  <div
                    className={
                      chartCompoentData.year === currentYear
                        ? "flex w-full"
                        : "hidden"
                    }
                  >
                    {chartCompoentData.component}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
