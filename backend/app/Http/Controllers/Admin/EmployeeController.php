<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class EmployeeController extends Controller
{
    public function index(): JsonResponse
    {
        $employees = Employee::with('user')->orderBy('created_at', 'desc')->get();
        return response()->json($employees);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'prename' => 'required|string|max:255',
            'cin' => 'required|string|max:20|unique:employees,cin',
            'phone' => 'required|string|max:20',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:6',
            'position' => 'nullable|string|max:255',
        ]);

        $user = \App\Models\User::create([
            'name' => $data['name'],
            'prename' => $data['prename'],
            'email' => $data['email'],
            'phone' => $data['phone'],
            'password' => Hash::make($data['password']),
            'role' => 'employee',
        ]);

        $employee = Employee::create([
            'user_id' => $user->id,
            'name' => $data['name'],
            'prename' => $data['prename'],
            'cin' => $data['cin'],
            'phone' => $data['phone'],
            'position' => $data['position'] ?? 'Employé',
        ]);

        return response()->json($employee->load('user'), 201);
    }

    public function update(Request $request, Employee $employee): JsonResponse
    {
        $data = $request->validate([
            'name' => 'sometimes|string|max:255',
            'prename' => 'sometimes|string|max:255',
            'cin' => 'sometimes|string|max:20|unique:employees,cin,' . $employee->id,
            'phone' => 'sometimes|string|max:20',
            'position' => 'nullable|string|max:255',
            'email' => 'sometimes|email|unique:users,email,' . $employee->user_id,
            'password' => 'nullable|string|min:6',
        ]);

        $employee->update($data);

        if (isset($data['email']) || isset($data['password'])) {
            $userData = [];
            if (isset($data['email'])) $userData['email'] = $data['email'];
            if (isset($data['password'])) $userData['password'] = Hash::make($data['password']);
            if (isset($data['name'])) $userData['name'] = $data['name'];
            if (isset($data['prename'])) $userData['prename'] = $data['prename'];
            $employee->user->update($userData);
        }

        return response()->json($employee->load('user'));
    }

    public function destroy(Employee $employee): JsonResponse
    {
        if ($employee->user) {
            $employee->user->delete();
        }
        $employee->delete();

        return response()->json(['message' => 'Employé supprimé']);
    }

    public function regenerateId(Employee $employee): JsonResponse
    {
        $employee->auto_id = 'EMP' . strtoupper(uniqid());
        $employee->save();

        return response()->json($employee);
    }
}