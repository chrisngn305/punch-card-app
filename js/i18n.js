// UI strings for each supported language. Values are strings with {param}
// placeholders, or functions of the params (for plurals).
export const LANGS = { en: 'English', vi: 'Tiếng Việt' };

const en = {
  'date.dn': ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  'date.dlong': ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  'date.mn': ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  'date.mlong': ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  'date.short': '{dn} {d} {mn}',
  'date.long': '{dlong}, {d} {mlong} {y}',
  'date.dayTitle': '{dlong} {d} {mn}',
  'dur': '{h}h {m}m',
  'brk.none': 'No break',
  'brk.min': '{m} min',
  'brk.hm': '{h}h {m}m',
  'brk.hr': '{h} hr',

  'role.Manager': 'Manager', 'role.Shift Lead': 'Shift Lead', 'role.Barista': 'Barista',
  'role.Kitchen': 'Kitchen', 'role.Front of House': 'Front of House',
  'area.Front': 'Front', 'area.Kitchen': 'Kitchen', 'area.Bar': 'Bar', 'area.Unrostered': 'Unrostered',
  'status.on': 'On shift', 'status.break': 'On break', 'status.off': 'Off', 'status.late': 'Late',
  'status.upcoming': 'Upcoming', 'status.done': 'Finished', 'status.inactive': 'Inactive',

  'common.lightMode': 'Light mode', 'common.darkMode': 'Dark mode',
  'common.loading': 'Loading…',
  'common.loadFailed': 'Could not reach the server. Is it running? (npm start)',
  'common.saveFailed': 'Could not save, so the latest data was reloaded',

  // Kiosk
  'kiosk.admin': 'Admin',
  'kiosk.onNow': '{n} on the clock',
  'kiosk.lede': 'Enter your PIN to clock in, take a break, or clock out.',
  'kiosk.demoPins': 'Demo PINs',
  'kiosk.clear': 'Clear', 'kiosk.delete': 'Delete',
  'pin.title': 'Enter your PIN',
  'pin.error': 'PIN not recognised. Please try again.', 'pin.msg': 'Your personal 4-digit code',
  'me.hi': 'Hi, {name}', 'me.todayShift': "Today's shift", 'me.worked': 'Worked today', 'me.notRostered': 'Not rostered',
  'me.notYou': 'Not you? Cancel',
  'act.in': 'Clock in', 'act.bstart': 'Start break', 'act.bend': 'End break', 'act.out': 'Clock out',
  'done.in': 'Clocked in', 'done.inLine': 'Have a good shift, {name}.',
  'done.bstart': 'Break started', 'done.bstartLine': 'Enjoy your break, {name}.',
  'done.bend': 'Back from break', 'done.bendLine': 'Welcome back, {name}.',
  'done.out': 'Clocked out', 'done.outLine': '{worked} worked ({from}–{to}, {brk}). See you next time, {name}.',
  'done.btn': 'Done',
  'cf.title': 'Confirm clock out', 'cf.sub': 'Check your times before you go, {name}.',
  'cf.clockedIn': 'Clocked in', 'cf.clockingOut': 'Clocking out', 'cf.today': 'Today', 'cf.now': 'Now',
  'cf.breakTaken': 'Break taken', 'cf.custom': 'Custom', 'cf.min': 'min',
  'cf.less': '5 minutes less', 'cf.more': '5 minutes more', 'cf.minutes': 'Break minutes',
  'cf.noneRecorded': 'None recorded. Forgot? Add it below.', 'cf.added': 'Added manually',
  'cf.recorded': 'Recorded: {brk}', 'cf.changed': 'Changed from {brk}', 'cf.recordedTag': 'recorded',
  'cf.tooLong': "Break can't be longer than the time on the clock.",
  'cf.total': 'Total worked', 'cf.confirm': 'Confirm clock out', 'cf.back': 'Back',

  // Admin
  'admin.badge': 'Admin', 'admin.signOut': 'Sign out', 'admin.signOutHint': 'Sign out and return to the kiosk',
  'tab.overview': 'Overview', 'tab.time': 'Timesheets', 'tab.roster': 'Roster', 'tab.staff': 'Staff',
  'week.prev': '‹ Prev', 'week.this': 'This week', 'week.next': 'Next ›',
  'ov.title': 'Today on the floor', 'ov.live': 'Live status', 'ov.people': '{n} people today',
  'ov.onShift': 'On shift now', 'ov.onBreak': 'On break', 'ov.late': 'Late / not in',
  'ov.hoursToday': 'Hours worked today', 'ov.cost': 'Labour cost this week',
  'ov.noShift': 'No shift', 'ov.notIn': 'Not in yet', 'ov.noTime': 'No time yet',
  'ov.in': 'In {t}', 'ov.out': ' · out {t}', 'ov.clockOut': 'Clock out',
  'ts.title': 'Timesheets', 'ts.allStaff': 'All staff', 'ts.filter': 'Filter by staff',
  'ts.add': '+ Add entry', 'ts.export': 'Export CSV',
  'ts.rostered': 'Rostered {h} h', 'ts.active': 'Active',
  'ts.colStaff': 'Staff', 'ts.colDate': 'Date', 'ts.colIn': 'In', 'ts.colOut': 'Out', 'ts.colBreak': 'Break',
  'ts.colHours': 'Hours', 'ts.colPay': 'Pay', 'ts.edit': 'Edit', 'ts.breakShort': 'break {b}',
  'ts.empty': 'No clock entries in this period.',
  'ts.count': p => p.n === 1 ? '1 entry' : `${p.n} entries`,
  'ro.title': 'Roster · {h} h scheduled · {cost} est.',
  'ro.copy': 'Copy last week', 'ro.add': '+ Add shift', 'ro.staff': 'Staff', 'ro.hrs': 'Hrs',
  'ro.viewLabel': 'Roster view', 'ro.viewWeek': 'Week', 'ro.viewDay': 'Day',
  'ro.addAt': 'Add shift for {name} at {t}', 'ro.onShift': 'On shift',
  'ro.addShift': 'Add shift', 'ro.coverage': 'Coverage', 'ro.empty': 'No one rostered.', 'ro.addDay': '+ Add shift on this day',
  'st.team': 'Team', 'st.active': '{n} active staff', 'st.showPins': 'Show PINs', 'st.hidePins': 'Hide PINs',
  'st.add': '+ Add staff', 'st.pin': 'PIN', 'st.rate': 'Rate', 'st.week': 'This week', 'st.edit': 'Edit',

  // Modal
  'm.newShift': 'New shift', 'm.editShift': 'Edit shift', 'm.addEntry': 'Add clock entry', 'm.editEntry': 'Edit clock entry',
  'm.addStaff': 'Add staff', 'm.editStaff': 'Edit staff',
  'm.staff': 'Staff', 'm.date': 'Date', 'm.start': 'Start', 'm.end': 'End', 'm.area': 'Area',
  'm.in': 'Clock in', 'm.out': 'Clock out', 'm.brk': 'Break (min)', 'm.openHint': 'Leave clock out empty if the shift is still in progress.',
  'm.name': 'Full name', 'm.namePh': 'e.g. Sam Taylor', 'm.role': 'Role', 'm.pin': '4-digit PIN', 'm.newPin': 'New',
  'm.rate': 'Hourly rate', 'm.activeCheck': 'Active (can clock in with their PIN)',
  'm.delete': 'Delete', 'm.cancel': 'Cancel', 'm.save': 'Save', 'm.close': 'Close',

  // Validation + toasts
  'err.shiftFields': 'Fill in date, start and end.', 'err.endAfterStart': 'End time must be after start time.',
  'err.overlap': 'Overlaps an existing shift ({from}–{to}).',
  'err.entryFields': 'Date and clock-in time are required.', 'err.outAfterIn': 'Clock out must be after clock in.',
  'err.breakTooLong': 'Break is longer than the shift.', 'err.openEntry': 'This person already has an open clock-in.',
  'err.name': 'Name is required.', 'err.pinFormat': 'PIN must be exactly 4 digits.',
  'err.pinUsed': "That PIN isn't available. Please choose another.",
  'toast.clockedOut': 'Clocked out at {t}', 'toast.addStaffFirst': 'Add a staff member first',
  'toast.shiftUpdated': 'Shift updated', 'toast.shiftAdded': 'Shift added',
  'toast.entryUpdated': 'Entry updated', 'toast.entryAdded': 'Entry added',
  'toast.staffUpdated': 'Staff updated', 'toast.staffAdded': '{name} added with PIN {pin}',
  'toast.deleted': 'Deleted', 'toast.exported': p => p.n === 1 ? 'Exported 1 entry' : `Exported ${p.n} entries`,
  'toast.copied': 'Copied {n} shifts from last week', 'toast.nothingToCopy': 'Nothing new to copy',

  // Roster notifications
  'ro.send': 'Send roster',
  'nt.title': 'Send roster · {range}',
  'nt.intro': 'Email each person their own shifts for this week.',
  'nt.notConfigured': "Email isn't set up yet (SMTP), so messages will only be printed in the server log. See the README to set it up.",
  'nt.from': 'Sending from {from}',
  'nt.loading': 'Loading…', 'nt.loadFailed': 'Could not load recipients.',
  'nt.empty': 'No shifts rostered this week.',
  'nt.noEmail': 'No email yet. Add one in Staff.',
  'nt.shifts': p => (p.n === 1 ? '1 shift' : `${p.n} shifts`) + ` · ${p.h} h`,
  'nt.notSent': 'Not sent yet', 'nt.sent': 'Sent {when}', 'nt.preview': 'Previewed {when}', 'nt.failed': 'Failed {when}',
  'nt.changed': 'Changed since sent',
  'nt.selectAll': 'Select all', 'nt.selectNeeded': 'Only new & changed', 'nt.selectNone': 'None',
  'nt.send': p => p.n === 1 ? 'Send to 1 person' : `Send to ${p.n} people`, 'nt.sending': 'Sending…',
  'toast.sent': p => p.n === 1 ? 'Roster emailed to 1 person' : `Roster emailed to ${p.n} people`,
  'toast.previewed': p => `Email isn't set up, so ${p.n === 1 ? '1 preview was' : p.n + ' previews were'} printed in the server log`,
  'toast.sendFailed': p => `${p.n} email${p.n === 1 ? '' : 's'} failed to send`,
  'mail.subject': 'Your shifts for {range}',
  'mail.greeting': 'Hi {name},',
  'mail.intro': "Here's your roster for {range}:",
  'mail.colDay': 'Day', 'mail.colTime': 'Time', 'mail.colArea': 'Area',
  'mail.total': p => `Total: ${p.n === 1 ? '1 shift' : p.n + ' shifts'}, ${p.h} hours`,
  'mail.footer': 'If anything needs to change, please let your manager know.',
  'm.email': 'Email', 'm.phone': 'Phone', 'm.emailPh': 'name@example.com',
  'm.phoneHint': "Phone is saved for later. SMS isn't enabled yet.",
  'err.email': 'Enter a valid email address.',

  // Staff: update my details (kiosk)
  'pf.open': 'Update my details', 'pf.title': 'Update my details',
  'pf.sub': 'Change your name, email or PIN.',
  'pf.newPin': 'New PIN', 'pf.newPin2': 'Repeat new PIN',
  'pf.pinHint': 'Leave the PIN fields empty to keep your current PIN.',
  'pf.save': 'Save my details',
  'toast.profileSaved': 'Your details were updated',
  'toast.profilePin': 'Your details and PIN were updated',
  'err.pinMatch': "The two PINs don't match.", 'err.nameLong': 'That name is too long.',

  // Admin sign-in
  'login.title': 'Admin sign in', 'login.sub': 'Sign in to manage timesheets, rosters and staff.',
  'login.setupTitle': 'Create the admin account',
  'login.setupSub': 'No admin account exists yet. Create one to protect the dashboard.',
  'login.name': 'Your name', 'login.password': 'Password', 'login.password2': 'Repeat password',
  'login.passwordHint': 'Use at least 8 characters.',
  'login.submit': 'Sign in', 'login.create': 'Create account', 'login.busy': 'Please wait…',
  'login.back': 'Back to kiosk',
  'err.login': 'Email or password is incorrect.',
  'err.passwordShort': 'The password must be at least 8 characters.',
  'err.passwordMatch': "The two passwords don't match.",
  'err.sessionEnded': 'You were signed out. Please sign in again.',
  'err.signIn': 'Please sign in.', 'err.setupDone': 'An admin account already exists.',
  'err.tooMany': 'Too many attempts. Please wait {s} seconds and try again.',
  'common.offline': "Can't reach the server. Please try again.",

  // Kiosk clock errors (e.g. the same person on two kiosks)
  'err.alreadyIn': "You're already clocked in.", 'err.notIn': "You're not clocked in.",
  'err.onBreak': "You're already on a break.", 'err.notOnBreak': "You're not on a break.",
  'err.badAction': 'Something went wrong. Please try again.',

  // CSV
  'csv.staff': 'Staff', 'csv.role': 'Role', 'csv.date': 'Date', 'csv.in': 'Clock in', 'csv.out': 'Clock out',
  'csv.break': 'Break (min)', 'csv.hours': 'Hours', 'csv.rate': 'Rate ({cur})', 'csv.pay': 'Pay ({cur})',
  'csv.file': 'timesheet',
};

const vi = {
  'date.dn': ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'],
  'date.dlong': ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'],
  'date.mn': ['Th1', 'Th2', 'Th3', 'Th4', 'Th5', 'Th6', 'Th7', 'Th8', 'Th9', 'Th10', 'Th11', 'Th12'],
  'date.mlong': ['tháng 1', 'tháng 2', 'tháng 3', 'tháng 4', 'tháng 5', 'tháng 6', 'tháng 7', 'tháng 8', 'tháng 9', 'tháng 10', 'tháng 11', 'tháng 12'],
  'date.short': '{dn} {d} {mn}',
  'date.long': '{dlong}, {d} {mlong}, {y}',
  'date.dayTitle': '{dlong}, {d} {mn}',
  'dur': '{h}g {m}p',
  'brk.none': 'Không nghỉ',
  'brk.min': '{m} phút',
  'brk.hm': '{h} giờ {m} phút',
  'brk.hr': '{h} giờ',

  'role.Manager': 'Quản lý', 'role.Shift Lead': 'Trưởng ca', 'role.Barista': 'Pha chế',
  'role.Kitchen': 'Bếp', 'role.Front of House': 'Phục vụ',
  'area.Front': 'Sảnh', 'area.Kitchen': 'Bếp', 'area.Bar': 'Quầy bar', 'area.Unrostered': 'Ngoài lịch',
  'status.on': 'Đang làm', 'status.break': 'Đang nghỉ', 'status.off': 'Nghỉ', 'status.late': 'Đi trễ',
  'status.upcoming': 'Sắp vào ca', 'status.done': 'Đã xong', 'status.inactive': 'Ngừng hoạt động',

  'common.lightMode': 'Chế độ sáng', 'common.darkMode': 'Chế độ tối',
  'common.loading': 'Đang tải…',
  'common.loadFailed': 'Không kết nối được máy chủ. Máy chủ đã chạy chưa? (npm start)',
  'common.saveFailed': 'Không lưu được nên đã tải lại dữ liệu mới nhất',

  // Kiosk
  'kiosk.admin': 'Quản trị',
  'kiosk.onNow': '{n} người đang trong ca',
  'kiosk.lede': 'Nhập mã PIN để vào ca, nghỉ giải lao hoặc tan ca.',
  'kiosk.demoPins': 'PIN mẫu',
  'kiosk.clear': 'Xoá hết', 'kiosk.delete': 'Xoá',
  'pin.title': 'Nhập mã PIN',
  'pin.error': 'Mã PIN không đúng. Vui lòng thử lại.', 'pin.msg': 'Mã cá nhân gồm 4 chữ số',
  'me.hi': 'Chào {name}', 'me.todayShift': 'Ca hôm nay', 'me.worked': 'Đã làm hôm nay', 'me.notRostered': 'Không có lịch',
  'me.notYou': 'Không phải bạn? Huỷ',
  'act.in': 'Vào ca', 'act.bstart': 'Bắt đầu nghỉ', 'act.bend': 'Kết thúc nghỉ', 'act.out': 'Tan ca',
  'done.in': 'Đã vào ca', 'done.inLine': 'Chúc {name} một ca làm vui vẻ.',
  'done.bstart': 'Bắt đầu nghỉ', 'done.bstartLine': 'Nghỉ ngơi vui vẻ nhé, {name}.',
  'done.bend': 'Đã quay lại', 'done.bendLine': 'Chào mừng trở lại, {name}.',
  'done.out': 'Đã tan ca', 'done.outLine': 'Đã làm {worked} ({from}–{to}, {brk}). Hẹn gặp lại, {name}.',
  'done.btn': 'Xong',
  'cf.title': 'Xác nhận tan ca', 'cf.sub': 'Kiểm tra lại giờ trước khi về nhé, {name}.',
  'cf.clockedIn': 'Giờ vào', 'cf.clockingOut': 'Giờ ra', 'cf.today': 'Hôm nay', 'cf.now': 'Bây giờ',
  'cf.breakTaken': 'Thời gian nghỉ', 'cf.custom': 'Tuỳ chỉnh', 'cf.min': 'phút',
  'cf.less': 'Bớt 5 phút', 'cf.more': 'Thêm 5 phút', 'cf.minutes': 'Số phút nghỉ',
  'cf.noneRecorded': 'Chưa ghi nhận. Quên bấm? Hãy thêm bên dưới.', 'cf.added': 'Đã thêm thủ công',
  'cf.recorded': 'Đã ghi nhận: {brk}', 'cf.changed': 'Đã đổi từ {brk}', 'cf.recordedTag': 'đã ghi',
  'cf.tooLong': 'Thời gian nghỉ không được dài hơn thời gian làm.',
  'cf.total': 'Tổng thời gian làm', 'cf.confirm': 'Xác nhận tan ca', 'cf.back': 'Quay lại',

  // Admin
  'admin.badge': 'Quản trị', 'admin.signOut': 'Đăng xuất', 'admin.signOutHint': 'Đăng xuất và quay lại máy chấm công',
  'tab.overview': 'Tổng quan', 'tab.time': 'Bảng công', 'tab.roster': 'Lịch làm', 'tab.staff': 'Nhân viên',
  'week.prev': '‹ Trước', 'week.this': 'Tuần này', 'week.next': 'Sau ›',
  'ov.title': 'Hôm nay tại cửa hàng', 'ov.live': 'Trạng thái trực tiếp', 'ov.people': '{n} người hôm nay',
  'ov.onShift': 'Đang trong ca', 'ov.onBreak': 'Đang nghỉ', 'ov.late': 'Trễ / chưa đến',
  'ov.hoursToday': 'Số giờ làm hôm nay', 'ov.cost': 'Chi phí nhân công tuần này',
  'ov.noShift': 'Không có ca', 'ov.notIn': 'Chưa vào ca', 'ov.noTime': 'Chưa có giờ',
  'ov.in': 'Vào {t}', 'ov.out': ' · ra {t}', 'ov.clockOut': 'Cho tan ca',
  'ts.title': 'Bảng công', 'ts.allStaff': 'Tất cả nhân viên', 'ts.filter': 'Lọc theo nhân viên',
  'ts.add': '+ Thêm lượt chấm', 'ts.export': 'Xuất CSV',
  'ts.rostered': 'Theo lịch {h} giờ', 'ts.active': 'Đang làm',
  'ts.colStaff': 'Nhân viên', 'ts.colDate': 'Ngày', 'ts.colIn': 'Vào', 'ts.colOut': 'Ra', 'ts.colBreak': 'Nghỉ',
  'ts.colHours': 'Giờ', 'ts.colPay': 'Lương', 'ts.edit': 'Sửa', 'ts.breakShort': 'nghỉ {b}',
  'ts.empty': 'Không có lượt chấm công nào trong khoảng này.',
  'ts.count': '{n} lượt',
  'ro.title': 'Lịch làm · {h} giờ · ước tính {cost}',
  'ro.copy': 'Sao chép tuần trước', 'ro.add': '+ Thêm ca', 'ro.staff': 'Nhân viên', 'ro.hrs': 'Giờ',
  'ro.viewLabel': 'Chế độ xem lịch', 'ro.viewWeek': 'Tuần', 'ro.viewDay': 'Ngày',
  'ro.addAt': 'Thêm ca cho {name} lúc {t}', 'ro.onShift': 'Số người',
  'ro.addShift': 'Thêm ca', 'ro.coverage': 'Tổng ca', 'ro.empty': 'Chưa có ai trong lịch.', 'ro.addDay': '+ Thêm ca cho ngày này',
  'st.team': 'Đội ngũ', 'st.active': '{n} nhân viên đang hoạt động', 'st.showPins': 'Hiện PIN', 'st.hidePins': 'Ẩn PIN',
  'st.add': '+ Thêm nhân viên', 'st.pin': 'PIN', 'st.rate': 'Lương/giờ', 'st.week': 'Tuần này', 'st.edit': 'Sửa',

  // Modal
  'm.newShift': 'Ca mới', 'm.editShift': 'Sửa ca', 'm.addEntry': 'Thêm lượt chấm công', 'm.editEntry': 'Sửa lượt chấm công',
  'm.addStaff': 'Thêm nhân viên', 'm.editStaff': 'Sửa nhân viên',
  'm.staff': 'Nhân viên', 'm.date': 'Ngày', 'm.start': 'Bắt đầu', 'm.end': 'Kết thúc', 'm.area': 'Khu vực',
  'm.in': 'Giờ vào', 'm.out': 'Giờ ra', 'm.brk': 'Nghỉ (phút)', 'm.openHint': 'Để trống giờ ra nếu ca vẫn đang diễn ra.',
  'm.name': 'Họ và tên', 'm.namePh': 'VD: Nguyễn Văn An', 'm.role': 'Vị trí', 'm.pin': 'PIN 4 chữ số', 'm.newPin': 'Mới',
  'm.rate': 'Lương theo giờ', 'm.activeCheck': 'Đang hoạt động (có thể chấm công bằng PIN)',
  'm.delete': 'Xoá', 'm.cancel': 'Huỷ', 'm.save': 'Lưu', 'm.close': 'Đóng',

  // Validation + toasts
  'err.shiftFields': 'Vui lòng nhập ngày, giờ bắt đầu và kết thúc.', 'err.endAfterStart': 'Giờ kết thúc phải sau giờ bắt đầu.',
  'err.overlap': 'Trùng với ca đã có ({from}–{to}).',
  'err.entryFields': 'Cần nhập ngày và giờ vào.', 'err.outAfterIn': 'Giờ ra phải sau giờ vào.',
  'err.breakTooLong': 'Thời gian nghỉ dài hơn cả ca.', 'err.openEntry': 'Người này đang có một lượt vào ca chưa kết thúc.',
  'err.name': 'Vui lòng nhập tên.', 'err.pinFormat': 'PIN phải gồm đúng 4 chữ số.',
  'err.pinUsed': 'Mã PIN này không dùng được. Vui lòng chọn mã khác.',
  'toast.clockedOut': 'Đã cho tan ca lúc {t}', 'toast.addStaffFirst': 'Hãy thêm nhân viên trước',
  'toast.shiftUpdated': 'Đã cập nhật ca', 'toast.shiftAdded': 'Đã thêm ca',
  'toast.entryUpdated': 'Đã cập nhật lượt chấm', 'toast.entryAdded': 'Đã thêm lượt chấm',
  'toast.staffUpdated': 'Đã cập nhật nhân viên', 'toast.staffAdded': 'Đã thêm {name} với mã PIN {pin}',
  'toast.deleted': 'Đã xoá', 'toast.exported': 'Đã xuất {n} lượt',
  'toast.copied': 'Đã sao chép {n} ca từ tuần trước', 'toast.nothingToCopy': 'Không có ca mới để sao chép',

  // Roster notifications
  'ro.send': 'Gửi lịch làm',
  'nt.title': 'Gửi lịch làm · {range}',
  'nt.intro': 'Gửi email lịch làm tuần này cho từng người.',
  'nt.notConfigured': 'Chưa cấu hình email (SMTP) nên tin nhắn chỉ được in ra nhật ký máy chủ. Xem README để cài đặt.',
  'nt.from': 'Gửi từ {from}',
  'nt.loading': 'Đang tải…', 'nt.loadFailed': 'Không tải được danh sách người nhận.',
  'nt.empty': 'Tuần này chưa có ca nào.',
  'nt.noEmail': 'Chưa có email. Hãy thêm trong mục Nhân viên.',
  'nt.shifts': '{n} ca · {h} giờ',
  'nt.notSent': 'Chưa gửi', 'nt.sent': 'Đã gửi {when}', 'nt.preview': 'Đã xem trước {when}', 'nt.failed': 'Lỗi {when}',
  'nt.changed': 'Đã thay đổi sau khi gửi',
  'nt.selectAll': 'Chọn tất cả', 'nt.selectNeeded': 'Chỉ mới & đã đổi', 'nt.selectNone': 'Bỏ chọn',
  'nt.send': 'Gửi cho {n} người', 'nt.sending': 'Đang gửi…',
  'toast.sent': 'Đã gửi lịch làm cho {n} người',
  'toast.previewed': 'Chưa cấu hình email nên đã in {n} bản xem trước ra nhật ký máy chủ',
  'toast.sendFailed': '{n} email gửi không thành công',
  'mail.subject': 'Lịch làm của bạn tuần {range}',
  'mail.greeting': 'Chào {name},',
  'mail.intro': 'Đây là lịch làm của bạn tuần {range}:',
  'mail.colDay': 'Ngày', 'mail.colTime': 'Giờ', 'mail.colArea': 'Khu vực',
  'mail.total': 'Tổng cộng: {n} ca, {h} giờ',
  'mail.footer': 'Nếu cần thay đổi, vui lòng báo cho quản lý.',
  'm.email': 'Email', 'm.phone': 'Số điện thoại', 'm.emailPh': 'ten@example.com',
  'm.phoneHint': 'Số điện thoại được lưu sẵn. Hiện chưa hỗ trợ gửi SMS.',
  'err.email': 'Email không hợp lệ.',

  // Staff: update my details (kiosk)
  'pf.open': 'Cập nhật thông tin của tôi', 'pf.title': 'Cập nhật thông tin',
  'pf.sub': 'Đổi tên, email hoặc mã PIN của bạn.',
  'pf.newPin': 'PIN mới', 'pf.newPin2': 'Nhập lại PIN mới',
  'pf.pinHint': 'Để trống ô PIN nếu muốn giữ mã PIN hiện tại.',
  'pf.save': 'Lưu thông tin',
  'toast.profileSaved': 'Đã cập nhật thông tin của bạn',
  'toast.profilePin': 'Đã cập nhật thông tin và mã PIN của bạn',
  'err.pinMatch': 'Hai mã PIN không khớp.', 'err.nameLong': 'Tên quá dài.',

  // Admin sign-in
  'login.title': 'Đăng nhập quản trị', 'login.sub': 'Đăng nhập để quản lý bảng công, lịch làm và nhân viên.',
  'login.setupTitle': 'Tạo tài khoản quản trị',
  'login.setupSub': 'Chưa có tài khoản quản trị nào. Hãy tạo một tài khoản để bảo vệ trang quản trị.',
  'login.name': 'Tên của bạn', 'login.password': 'Mật khẩu', 'login.password2': 'Nhập lại mật khẩu',
  'login.passwordHint': 'Dùng ít nhất 8 ký tự.',
  'login.submit': 'Đăng nhập', 'login.create': 'Tạo tài khoản', 'login.busy': 'Vui lòng đợi…',
  'login.back': 'Về máy chấm công',
  'err.login': 'Email hoặc mật khẩu không đúng.',
  'err.passwordShort': 'Mật khẩu phải có ít nhất 8 ký tự.',
  'err.passwordMatch': 'Hai mật khẩu không khớp.',
  'err.sessionEnded': 'Bạn đã bị đăng xuất. Vui lòng đăng nhập lại.',
  'err.signIn': 'Vui lòng đăng nhập.', 'err.setupDone': 'Đã có tài khoản quản trị.',
  'err.tooMany': 'Thử quá nhiều lần. Vui lòng đợi {s} giây rồi thử lại.',
  'common.offline': 'Không kết nối được máy chủ. Vui lòng thử lại.',

  // Kiosk clock errors (e.g. the same person on two kiosks)
  'err.alreadyIn': 'Bạn đã vào ca rồi.', 'err.notIn': 'Bạn chưa vào ca.',
  'err.onBreak': 'Bạn đang nghỉ rồi.', 'err.notOnBreak': 'Bạn không trong giờ nghỉ.',
  'err.badAction': 'Đã có lỗi. Vui lòng thử lại.',

  // CSV
  'csv.staff': 'Nhân viên', 'csv.role': 'Vị trí', 'csv.date': 'Ngày', 'csv.in': 'Giờ vào', 'csv.out': 'Giờ ra',
  'csv.break': 'Nghỉ (phút)', 'csv.hours': 'Số giờ', 'csv.rate': 'Lương/giờ ({cur})', 'csv.pay': 'Thành tiền ({cur})',
  'csv.file': 'bang-cong',
};

const DICTS = { en, vi };
let lang = 'en';

export const getLang = () => lang;
export const setLang = l => { if (DICTS[l]) lang = l; };
export const locale = () => (lang === 'vi' ? 'vi-VN' : 'en-GB');

// Look up a string (falls back to English, then the key) and fill {params}.
export function t(key, params = {}) {
  const v = DICTS[lang][key] ?? en[key] ?? key;
  if (typeof v === 'function') return v(params);
  if (typeof v !== 'string') return v;
  return v.replace(/\{(\w+)\}/g, (m, k) => (k in params ? params[k] : m));
}

// Translate a stored value (role, area) that may not be in the dictionary.
export const tv = (prefix, value) => {
  const k = prefix + '.' + value;
  return k in DICTS[lang] || k in en ? t(k) : value;
};
