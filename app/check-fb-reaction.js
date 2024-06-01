// const fs = require("fs");

// const user_data = fs.readFileSync(".\\user.txt", "utf8");
// const user = user_data.trim().split("\n");
// const reaction_data = fs.readFileSync(".\\data.txt", "utf8");
// const reaction_url_list = reaction_data
//   .trim()
//   .split("\n")
//   .map((el) => el.trim());

function check(user_info_list, reaction_url_list) {
  let user_map = new Map();
  let user_url_list = [];

  user_info_list.map((el) => {
    let [url, fullname, donvi] = el.trim().split(",");
    user_map.set(url, { fullname, donvi, counter: 0 });
    user_url_list.push(url);
  });

  reaction_url_list.forEach((url) => {
    if (user_url_list.includes(url)) {
      user_map.get(url).counter += 1;
    }
  });

  let not_reactive_user = Array.from(user_map.entries())
    .filter(([key, value]) => value.counter == 0)
    .map(([key, value]) => `[${value.donvi}] ${value.fullname} (${key})}`);

  let donvi = {};

  Array.from(user_map.entries()).map(([key, value]) => {
    if (!Object.keys(donvi).includes(value.donvi)) {
      donvi[value.donvi] = 0;
    }

    donvi[value.donvi] += value.counter;
  });

  return { khongtuongtac: not_reactive_user, thongke: donvi };
}

let user_info_list = [
  "https://www.facebook.com/11,Nguyễn Văn A,C1",
  "https://www.facebook.com/12,Nguyễn Văn B,C1",
  "https://www.facebook.com/21,Nguyễn Văn C,C2",
  "https://www.facebook.com/22,Nguyễn Văn D,C2",
  "https://www.facebook.com/23,Nguyễn Văn E,C2",
  "https://www.facebook.com/31,Nguyễn Văn F,C3",
  "https://www.facebook.com/32,Nguyễn Văn G,C3",
  "https://www.facebook.com/33,Nguyễn Văn H,C3",
];

let reaction_url_list = [
  "https://www.facebook.com/12",
  "https://www.facebook.com/21",
  "https://www.facebook.com/22",
  "https://www.facebook.com/23",
  "https://www.facebook.com/31",
  "https://www.facebook.com/12",
  "https://www.facebook.com/12",
  "https://www.facebook.com/41",
  "https://www.facebook.com/12",
  "https://www.facebook.com/31",
  "https://www.facebook.com/12",
];

let result = check(user_info_list, reaction_url_list);
console.log(result);
